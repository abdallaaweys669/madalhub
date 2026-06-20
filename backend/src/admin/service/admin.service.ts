import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { OrganizerPaymentRequest } from 'src/database/entities/organizer-payment-request.entity';
import { Event } from 'src/database/entities/event.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { Repository } from 'typeorm';
import { isProfileComplete } from 'src/onboarding/helpers/organizer-profile.helper';
import { ConfigService } from '@nestjs/config';
import { OrganizerNotificationsService } from 'src/notifications/organizer-notifications.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    @InjectRepository(OrganizerVerificationDocument)
    private organizerDocumentRepository: Repository<OrganizerVerificationDocument>,
    @InjectRepository(OrganizerPaymentRequest)
    private paymentRequestRepository: Repository<OrganizerPaymentRequest>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventRegistration)
    private registrationRepository: Repository<EventRegistration>,
    private configService: ConfigService,
    private organizerNotificationsService: OrganizerNotificationsService,
  ) {}

  isProfileComplete(profile: OrganizerProfile): boolean {
    return isProfileComplete(profile);
  }

  async approveOrganizer(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    const organizerProfile = await this.organizerProfileRepository.findOne({
      where: { userId: user.id },
    });

    if (!organizerProfile) {
      throw new BadRequestException('Organizer profile not found');
    }

    if (!this.isProfileComplete(organizerProfile)) {
      throw new BadRequestException('Organizer profile is incomplete');
    }

    const documents = await this.organizerDocumentRepository.find({
      where: { organizerId: user.id },
      select: ['id'],
    });

    if (documents.length !== 1) {
      throw new BadRequestException(
        'Organizer must have exactly one verification document before approval',
      );
    }

    user.status = 'active';
    organizerProfile.verificationStatus = 'approved';

    await this.organizerProfileRepository.save(organizerProfile);
    void this.organizerNotificationsService
      .notifyVerificationApproved(user.id)
      .catch(() => undefined);
    return this.userRepository.save(user);
  }

  async rejectOrganizer(id: number, reason?: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    user.status = 'active';
    await this.userRepository.save(user);

    const organizerProfile = await this.organizerProfileRepository.findOne({
      where: { userId: user.id },
    });

    if (organizerProfile) {
      organizerProfile.verificationStatus = 'rejected';
      organizerProfile.rejectionReason =
        reason ?? organizerProfile.rejectionReason;
      await this.organizerProfileRepository.save(organizerProfile);
    }

    void this.organizerNotificationsService
      .notifyVerificationRejected(user.id, organizerProfile?.rejectionReason)
      .catch(() => undefined);

    return {
      userId: user.id,
      status: 'rejected',
      rejectionReason: organizerProfile?.rejectionReason,
    };
  }

  async getPendingOrganizers() {
    const profiles = await this.organizerProfileRepository.find({
      where: { verificationStatus: 'pending' },
    });

    return Promise.all(
      profiles.map(async (profile) => {
        const user = await this.userRepository.findOne({
          where: { id: profile.userId, roleId: 2 },
        });
        if (!user) return null;

        const document = await this.organizerDocumentRepository.findOne({
          where: { organizerId: user.id },
        });

        return {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          userStatus: user.status,
          verificationStatus: profile.verificationStatus,
          profile: {
            organizationName: profile.organizationName,
            organizationDescription: profile.organizationDescription,
            website: profile.website,
          },
          document: document
            ? {
                documentType: document.documentType,
                documentPath: document.documentPath,
                status: document.status,
              }
            : null,
        };
      }),
    ).then((rows) => rows.filter(Boolean));
  }

  async getPendingPaymentRequests() {
    const rows = await this.paymentRequestRepository.find({
      where: { status: 'pending' },
      order: { id: 'ASC' },
    });

    return Promise.all(
      rows.map(async (row) => {
        const user = await this.userRepository.findOne({
          where: { id: row.organizerId, roleId: 2 },
        });
        const profile = await this.organizerProfileRepository.findOne({
          where: { userId: row.organizerId },
        });
        return {
          id: row.id,
          organizerId: row.organizerId,
          organizerName:
            profile?.organizationName?.trim() || user?.fullName || 'Organizer',
          organizerEmail: user?.email ?? null,
          plan: row.plan,
          amountUsd: Number(row.amountUsd),
          paymentReference: row.paymentReference,
          note: row.note,
          createdAt: row.createdAt,
        };
      }),
    );
  }

  async approvePaymentRequest(id: number) {
    const request = await this.paymentRequestRepository.findOne({
      where: { id },
    });
    if (!request || request.status !== 'pending') {
      throw new NotFoundException('Payment request not found');
    }

    const credits =
      request.plan === 'bundle'
        ? Number(this.configService.get('PUBLISH_BUNDLE_CREDITS') ?? 5)
        : 1;

    const profile = await this.organizerProfileRepository.findOne({
      where: { userId: request.organizerId },
    });
    if (!profile) {
      throw new BadRequestException('Organizer profile not found');
    }

    profile.paidPublishCredits += credits;
    await this.organizerProfileRepository.save(profile);

    request.status = 'approved';
    request.creditsGranted = credits;
    await this.paymentRequestRepository.save(request);

    void this.organizerNotificationsService
      .notifyPaymentApproved(request.organizerId, credits)
      .catch(() => undefined);

    return {
      id: request.id,
      organizerId: request.organizerId,
      creditsGranted: credits,
      paidPublishCredits: profile.paidPublishCredits,
      message: 'Payment approved and publish credits granted.',
    };
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const countMembersInRange = (start: Date, end: Date) =>
      this.userRepository
        .createQueryBuilder('u')
        .where('u.roleId = :r', { r: 1 })
        .andWhere('u.createdAt >= :s AND u.createdAt <= :e', { s: start, e: end })
        .getCount();

    const countOrganizersInRange = (start: Date, end: Date) =>
      this.userRepository
        .createQueryBuilder('u')
        .where('u.roleId = :r', { r: 2 })
        .andWhere('u.createdAt >= :s AND u.createdAt <= :e', { s: start, e: end })
        .getCount();

    const countEventsInRange = (start: Date, end: Date) =>
      this.eventRepository
        .createQueryBuilder('e')
        .where('e.createdAt >= :s AND e.createdAt <= :e', { s: start, e: end })
        .getCount();

    const countRegistrationsInRange = (start: Date, end: Date) =>
      this.registrationRepository
        .createQueryBuilder('r')
        .where('r.status != :cancelled', { cancelled: 'cancelled' })
        .andWhere('r.createdAt >= :s AND r.createdAt <= :e', { s: start, e: end })
        .getCount();

    const [
      totalMembers,
      totalOrganizers,
      totalEvents,
      totalRegistrations,
      newMembersThisMonth,
      newOrganizersThisMonth,
      eventsThisMonth,
      registrationsThisMonth,
      pendingVerifications,
      pendingPayments,
      newMembersLastMonth,
      newOrganizersLastMonth,
      eventsLastMonth,
      registrationsLastMonth,
      allApproved,
    ] = await Promise.all([
      this.userRepository.count({ where: { roleId: 1 } }),
      this.userRepository.count({ where: { roleId: 2 } }),
      this.eventRepository.count(),
      this.registrationRepository
        .createQueryBuilder('r')
        .where('r.status != :cancelled', { cancelled: 'cancelled' })
        .getCount(),
      countMembersInRange(startOfMonth, now),
      countOrganizersInRange(startOfMonth, now),
      countEventsInRange(startOfMonth, now),
      countRegistrationsInRange(startOfMonth, now),
      this.organizerProfileRepository.count({
        where: { verificationStatus: 'pending' },
      }),
      this.paymentRequestRepository.count({ where: { status: 'pending' } }),
      countMembersInRange(startOfLastMonth, endOfLastMonth),
      countOrganizersInRange(startOfLastMonth, endOfLastMonth),
      countEventsInRange(startOfLastMonth, endOfLastMonth),
      countRegistrationsInRange(startOfLastMonth, endOfLastMonth),
      this.paymentRequestRepository.find({ where: { status: 'approved' } }),
    ]);

    const trendMonths: string[] = [];
    const trends = {
      members: [] as number[],
      organizers: [] as number[],
      events: [] as number[],
      registrations: [] as number[],
    };

    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      trendMonths.push(mStart.toLocaleString('default', { month: 'short' }));

      const [members, organizers, events, registrations] = await Promise.all([
        countMembersInRange(mStart, mEnd),
        countOrganizersInRange(mStart, mEnd),
        countEventsInRange(mStart, mEnd),
        countRegistrationsInRange(mStart, mEnd),
      ]);

      trends.members.push(members);
      trends.organizers.push(organizers);
      trends.events.push(events);
      trends.registrations.push(registrations);
    }

    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const rev = allApproved
        .filter((r) => r.createdAt >= mStart && r.createdAt <= mEnd)
        .reduce((sum, r) => sum + Number(r.amountUsd), 0);
      monthlyRevenue.push({
        month: mStart.toLocaleString('default', { month: 'short' }),
        revenue: rev,
      });
    }

    // Recent activity: latest 5 pending organizers + latest 5 pending payments
    const [recentOrgs, recentPayments] = await Promise.all([
      this.organizerProfileRepository
        .createQueryBuilder('p')
        .where('p.verificationStatus = :s', { s: 'pending' })
        .orderBy('p.userId', 'DESC')
        .limit(5)
        .getMany(),
      this.paymentRequestRepository
        .createQueryBuilder('r')
        .orderBy('r.createdAt', 'DESC')
        .limit(5)
        .getMany(),
    ]);

    const recentOrgActivity = await Promise.all(
      recentOrgs.map(async (p) => {
        const user = await this.userRepository.findOne({ where: { id: p.userId } });
        return {
          type: 'verification' as const,
          id: p.userId,
          name: p.organizationName ?? user?.fullName ?? 'Organizer',
          email: user?.email ?? null,
          status: p.verificationStatus,
          createdAt: user?.createdAt ?? new Date(),
        };
      }),
    );

    const recentPaymentActivity = await Promise.all(
      recentPayments.map(async (r) => {
        const profile = await this.organizerProfileRepository.findOne({
          where: { userId: r.organizerId },
        });
        const user = await this.userRepository.findOne({ where: { id: r.organizerId } });
        return {
          type: 'payment' as const,
          id: r.id,
          name: profile?.organizationName ?? user?.fullName ?? 'Organizer',
          email: user?.email ?? null,
          amount: Number(r.amountUsd),
          plan: r.plan,
          status: r.status,
          createdAt: r.createdAt,
        };
      }),
    );

    return {
      totals: {
        members: totalMembers,
        organizers: totalOrganizers,
        events: totalEvents,
        registrations: totalRegistrations,
      },
      pending: {
        verifications: pendingVerifications,
        payments: pendingPayments,
      },
      thisMonth: {
        members: newMembersThisMonth,
        organizers: newOrganizersThisMonth,
        events: eventsThisMonth,
        registrations: registrationsThisMonth,
      },
      lastMonth: {
        members: newMembersLastMonth,
        organizers: newOrganizersLastMonth,
        events: eventsLastMonth,
        registrations: registrationsLastMonth,
      },
      trends,
      trendMonths,
      monthlyRevenue,
      recentActivity: [...recentOrgActivity, ...recentPaymentActivity].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ).slice(0, 8),
    };
  }

  async rejectPaymentRequest(id: number, adminNote?: string) {
    const request = await this.paymentRequestRepository.findOne({
      where: { id },
    });
    if (!request || request.status !== 'pending') {
      throw new NotFoundException('Payment request not found');
    }

    request.status = 'rejected';
    request.adminNote = adminNote?.trim() || null;
    await this.paymentRequestRepository.save(request);

    void this.organizerNotificationsService
      .notifyPaymentRejected(request.organizerId, request.adminNote)
      .catch(() => undefined);

    return {
      id: request.id,
      status: request.status,
      adminNote: request.adminNote,
    };
  }
}
