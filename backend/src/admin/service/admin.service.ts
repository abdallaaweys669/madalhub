import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { OrganizerPaymentRequest } from 'src/database/entities/organizer-payment-request.entity';
import { OrganizerCreditRequest } from 'src/database/entities/organizer-credit-request.entity';
import { Event } from 'src/database/entities/event.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { Repository } from 'typeorm';
import { isProfileComplete } from 'src/onboarding/helpers/organizer-profile.helper';
import { ConfigService } from '@nestjs/config';
import { OrganizerNotificationsService } from 'src/notifications/organizer-notifications.service';
import * as bcrypt from 'bcrypt';
import { AdminListQueryDto } from '../dto/admin-list-query.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { AdminReportQueryDto } from '../dto/admin-report-query.dto';
import { GrantOrganizerCreditsDto } from '../dto/grant-organizer-credits.dto';

const ADMIN_ROLE_ID = 3;
const PRIMARY_ADMIN_EMAIL = 'admin@gmail.com';
const MEMBER_ROLE_ID = 1;
const ORGANIZER_ROLE_ID = 2;

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

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
    @InjectRepository(OrganizerCreditRequest)
    private creditRequestRepository: Repository<OrganizerCreditRequest>,
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

  async getPendingCreditRequests() {
    const rows = await this.creditRequestRepository.find({
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
          eventId: row.eventId,
          eventTitle: row.eventTitle,
          currentCredits: profile?.paidPublishCredits ?? 0,
          createdAt: row.createdAt,
        };
      }),
    );
  }

  async grantCreditRequest(id: number, credits: number) {
    const request = await this.creditRequestRepository.findOne({
      where: { id },
    });
    if (!request || request.status !== 'pending') {
      throw new NotFoundException('Credit request not found');
    }

    const profile = await this.organizerProfileRepository.findOne({
      where: { userId: request.organizerId },
    });
    if (!profile) {
      throw new BadRequestException('Organizer profile not found');
    }

    profile.paidPublishCredits += credits;
    await this.organizerProfileRepository.save(profile);

    request.status = 'granted';
    request.creditsGranted = credits;
    request.resolvedAt = new Date();
    await this.creditRequestRepository.save(request);

    void this.organizerNotificationsService
      .notifyCreditsGranted(request.organizerId, credits)
      .catch(() => undefined);

    return {
      id: request.id,
      organizerId: request.organizerId,
      creditsGranted: credits,
      paidPublishCredits: profile.paidPublishCredits,
      message: 'Publish credits granted.',
    };
  }

  async dismissCreditRequest(id: number) {
    const request = await this.creditRequestRepository.findOne({
      where: { id },
    });
    if (!request || request.status !== 'pending') {
      throw new NotFoundException('Credit request not found');
    }

    request.status = 'dismissed';
    request.resolvedAt = new Date();
    await this.creditRequestRepository.save(request);

    return {
      id: request.id,
      status: request.status,
    };
  }

  async grantOrganizerCredits(organizerId: number, dto: GrantOrganizerCreditsDto) {
    const user = await this.userRepository.findOne({
      where: { id: organizerId, roleId: 2 },
    });
    if (!user) {
      throw new NotFoundException('Organizer not found');
    }

    const profile = await this.organizerProfileRepository.findOne({
      where: { userId: organizerId },
    });
    if (!profile) {
      throw new BadRequestException('Organizer profile not found');
    }

    profile.paidPublishCredits += dto.credits;
    await this.organizerProfileRepository.save(profile);

    void this.organizerNotificationsService
      .notifyCreditsGranted(organizerId, dto.credits)
      .catch(() => undefined);

    return {
      organizerId,
      creditsGranted: dto.credits,
      paidPublishCredits: profile.paidPublishCredits,
      message: 'Publish credits granted.',
    };
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
      pendingCreditRequests,
      newMembersLastMonth,
      newOrganizersLastMonth,
      eventsLastMonth,
      registrationsLastMonth,
      draftEvents,
      publishedEvents,
      cancelledEvents,
      unverifiedOrganizers,
      approvedOrganizers,
      rejectedOrganizers,
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
      this.creditRequestRepository.count({ where: { status: 'pending' } }),
      countMembersInRange(startOfLastMonth, endOfLastMonth),
      countOrganizersInRange(startOfLastMonth, endOfLastMonth),
      countEventsInRange(startOfLastMonth, endOfLastMonth),
      countRegistrationsInRange(startOfLastMonth, endOfLastMonth),
      this.eventRepository.count({ where: { status: 'draft' } }),
      this.eventRepository.count({ where: { status: 'published' } }),
      this.eventRepository.count({ where: { status: 'cancelled' } }),
      this.organizerProfileRepository.count({
        where: { verificationStatus: 'unverified' },
      }),
      this.organizerProfileRepository.count({
        where: { verificationStatus: 'approved' },
      }),
      this.organizerProfileRepository.count({
        where: { verificationStatus: 'rejected' },
      }),
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

    // Recent activity: latest 5 pending organizers + latest 5 pending credit requests
    const [recentOrgs, recentCreditRequests] = await Promise.all([
      this.organizerProfileRepository
        .createQueryBuilder('p')
        .where('p.verificationStatus = :s', { s: 'pending' })
        .orderBy('p.userId', 'DESC')
        .limit(5)
        .getMany(),
      this.creditRequestRepository
        .createQueryBuilder('r')
        .where('r.status = :s', { s: 'pending' })
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

    const recentCreditActivity = await Promise.all(
      recentCreditRequests.map(async (r) => {
        const profile = await this.organizerProfileRepository.findOne({
          where: { userId: r.organizerId },
        });
        const user = await this.userRepository.findOne({ where: { id: r.organizerId } });
        return {
          type: 'credit_request' as const,
          id: r.id,
          name: profile?.organizationName ?? user?.fullName ?? 'Organizer',
          email: user?.email ?? null,
          eventTitle: r.eventTitle,
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
        creditRequests: pendingCreditRequests,
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
      eventStatusBreakdown: {
        draft: draftEvents,
        published: publishedEvents,
        cancelled: cancelledEvents,
      },
      verificationBreakdown: {
        unverified: unverifiedOrganizers,
        pending: pendingVerifications,
        approved: approvedOrganizers,
        rejected: rejectedOrganizers,
      },
      recentActivity: [...recentOrgActivity, ...recentCreditActivity].sort(
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

  private paginate(query: AdminListQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    return { page, limit, skip: (page - 1) * limit };
  }

  private toPaginated<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listMembers(query: AdminListQueryDto): Promise<Paginated<Record<string, unknown>>> {
    const { page, limit, skip } = this.paginate(query);
    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('u.roleId = :roleId', { roleId: MEMBER_ROLE_ID });

    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere('(u.fullName LIKE :s OR u.email LIKE :s)', { s });
    }
    if (query.status?.trim()) {
      qb.andWhere('u.status = :status', { status: query.status.trim() });
    }

    qb.orderBy('u.createdAt', 'DESC');
    const total = await qb.getCount();
    const rows = await qb.skip(skip).take(limit).getMany();

    return this.toPaginated(
      rows.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        location: u.location,
        status: u.status,
        emailVerified: !!u.emailVerifiedAt,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  async listOrganizers(query: AdminListQueryDto): Promise<Paginated<Record<string, unknown>>> {
    const { page, limit, skip } = this.paginate(query);
    const qb = this.organizerProfileRepository
      .createQueryBuilder('p')
      .innerJoin(User, 'u', 'u.id = p.userId AND u.roleId = :roleId', {
        roleId: ORGANIZER_ROLE_ID,
      });

    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere(
        '(p.organizationName LIKE :s OR u.fullName LIKE :s OR u.email LIKE :s)',
        { s },
      );
    }
    if (query.status?.trim()) {
      qb.andWhere('p.verificationStatus = :vs', { vs: query.status.trim() });
    }
    if (query.activity === 'with-events') {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM events e WHERE e.organizer_id = p.user_id)',
      );
    } else if (query.activity === 'no-events') {
      qb.andWhere(
        'NOT EXISTS (SELECT 1 FROM events e WHERE e.organizer_id = p.user_id)',
      );
    }

    qb.orderBy('p.createdAt', 'DESC');
    const total = await qb.getCount();
    const profiles = await qb.skip(skip).take(limit).getMany();

    const organizerIds = profiles.map((p) => p.userId);
    const eventCountMap = new Map<number, number>();
    if (organizerIds.length > 0) {
      const countRows = await this.eventRepository
        .createQueryBuilder('e')
        .select('e.organizerId', 'organizerId')
        .addSelect('COUNT(*)', 'eventCount')
        .where('e.organizerId IN (:...organizerIds)', { organizerIds })
        .groupBy('e.organizerId')
        .getRawMany<{ organizerId: string; eventCount: string }>();
      for (const row of countRows) {
        eventCountMap.set(Number(row.organizerId), Number(row.eventCount));
      }
    }

    const items = await Promise.all(
      profiles.map(async (profile) => {
        const user = await this.userRepository.findOne({
          where: { id: profile.userId },
        });
        return {
          id: profile.userId,
          fullName: user?.fullName ?? '',
          email: user?.email ?? '',
          userStatus: user?.status ?? '',
          verificationStatus: profile.verificationStatus,
          organizationName: profile.organizationName,
          website: profile.website,
          paidPublishCredits: profile.paidPublishCredits,
          freePublishUsed: profile.freePublishUsed,
          eventCount: eventCountMap.get(profile.userId) ?? 0,
          createdAt: profile.createdAt,
        };
      }),
    );

    return this.toPaginated(items, total, page, limit);
  }

  async listEvents(query: AdminListQueryDto): Promise<Paginated<Record<string, unknown>>> {
    const { page, limit, skip } = this.paginate(query);
    const qb = this.eventRepository.createQueryBuilder('e');

    if (query.search?.trim()) {
      qb.andWhere('(e.title LIKE :s OR e.locationName LIKE :s)', {
        s: `%${query.search.trim()}%`,
      });
    }
    if (query.status?.trim()) {
      qb.andWhere('e.status = :status', { status: query.status.trim() });
    }

    qb.orderBy('e.createdAt', 'DESC');
    const total = await qb.getCount();
    const events = await qb.skip(skip).take(limit).getMany();

    const items = await Promise.all(
      events.map(async (event) => {
        const organizer = await this.organizerProfileRepository.findOne({
          where: { userId: event.organizerId },
        });
        const regCount = await this.registrationRepository
          .createQueryBuilder('r')
          .where('r.eventId = :eventId', { eventId: event.id })
          .andWhere('r.status != :cancelled', { cancelled: 'cancelled' })
          .getCount();
        return {
          id: event.id,
          title: event.title,
          organizerId: event.organizerId,
          organizerName: organizer?.organizationName ?? 'Organizer',
          status: event.status,
          audienceGender: event.audienceGender,
          capacity: event.capacity,
          registrationCount: regCount,
          startDatetime: event.startDatetime,
          locationName: event.locationName,
          createdAt: event.createdAt,
        };
      }),
    );

    return this.toPaginated(items, total, page, limit);
  }

  async listRegistrations(query: AdminListQueryDto): Promise<Paginated<Record<string, unknown>>> {
    const { page, limit, skip } = this.paginate(query);
    const qb = this.registrationRepository.createQueryBuilder('r');

    if (query.status?.trim()) {
      qb.andWhere('r.status = :status', { status: query.status.trim() });
    }
    if (query.eventId) {
      qb.andWhere('r.eventId = :eventId', { eventId: query.eventId });
    }
    if (query.memberId) {
      qb.andWhere('r.memberId = :memberId', { memberId: query.memberId });
    }

    qb.orderBy('r.createdAt', 'DESC');
    let rows = await qb.getMany();
    let filtered = rows;

    if (query.search?.trim()) {
      const term = query.search.trim().toLowerCase();
      const enriched = await Promise.all(
        rows.map(async (r) => {
          const [member, event] = await Promise.all([
            this.userRepository.findOne({ where: { id: r.memberId } }),
            this.eventRepository.findOne({ where: { id: r.eventId } }),
          ]);
          return { r, member, event };
        }),
      );
      filtered = enriched
        .filter(
          ({ member, event }) =>
            member?.fullName?.toLowerCase().includes(term) ||
            member?.email?.toLowerCase().includes(term) ||
            event?.title?.toLowerCase().includes(term),
        )
        .map(({ r }) => r);
    }

    const total = filtered.length;
    const slice = filtered.slice(skip, skip + limit);

    const items = await Promise.all(
      slice.map(async (r) => {
        const [member, event] = await Promise.all([
          this.userRepository.findOne({ where: { id: r.memberId } }),
          this.eventRepository.findOne({ where: { id: r.eventId } }),
        ]);
        let organizerUser: User | null = null;
        let organizerProfile: OrganizerProfile | null = null;
        if (event?.organizerId) {
          [organizerUser, organizerProfile] = await Promise.all([
            this.userRepository.findOne({ where: { id: event.organizerId } }),
            this.organizerProfileRepository.findOne({
              where: { userId: event.organizerId },
            }),
          ]);
        }
        return {
          id: r.id,
          eventId: r.eventId,
          eventTitle: event?.title ?? `#${r.eventId}`,
          memberId: r.memberId,
          memberName: member?.fullName ?? 'Member',
          memberEmail: member?.email ?? '',
          status: r.status,
          createdAt: r.createdAt,
          organizerId: event?.organizerId ?? null,
          organizerName:
            organizerProfile?.organizationName?.trim() ||
            organizerUser?.fullName ||
            null,
          organizerEmail: organizerUser?.email ?? null,
        };
      }),
    );

    return this.toPaginated(items, total, page, limit);
  }

  async listPaymentRequests(query: AdminListQueryDto): Promise<Paginated<Record<string, unknown>>> {
    const { page, limit, skip } = this.paginate(query);
    const qb = this.paymentRequestRepository.createQueryBuilder('p');

    if (query.status?.trim()) {
      qb.andWhere('p.status = :status', { status: query.status.trim() });
    }

    qb.orderBy('p.createdAt', 'DESC');
    const rows = await qb.getMany();

    let filtered = rows;
    if (query.search?.trim()) {
      const term = query.search.trim().toLowerCase();
      const enriched = await Promise.all(
        rows.map(async (row) => {
          const user = await this.userRepository.findOne({
            where: { id: row.organizerId },
          });
          const profile = await this.organizerProfileRepository.findOne({
            where: { userId: row.organizerId },
          });
          return { row, user, profile };
        }),
      );
      filtered = enriched
        .filter(
          ({ user, profile, row }) =>
            profile?.organizationName?.toLowerCase().includes(term) ||
            user?.fullName?.toLowerCase().includes(term) ||
            user?.email?.toLowerCase().includes(term) ||
            row.paymentReference?.toLowerCase().includes(term),
        )
        .map(({ row }) => row);
    }

    const total = filtered.length;
    const slice = filtered.slice(skip, skip + limit);

    const items = await Promise.all(
      slice.map(async (row) => {
        const user = await this.userRepository.findOne({
          where: { id: row.organizerId },
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
          status: row.status,
          paymentReference: row.paymentReference,
          creditsGranted: row.creditsGranted,
          createdAt: row.createdAt,
        };
      }),
    );

    return this.toPaginated(items, total, page, limit);
  }

  async listAdmins(query: AdminListQueryDto): Promise<Paginated<Record<string, unknown>>> {
    const { page, limit, skip } = this.paginate(query);
    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('u.roleId = :roleId', { roleId: ADMIN_ROLE_ID });

    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere('(u.fullName LIKE :s OR u.email LIKE :s)', { s });
    }
    if (query.status?.trim()) {
      qb.andWhere('u.status = :status', { status: query.status.trim() });
    }

    qb.orderBy('u.createdAt', 'DESC');
    const total = await qb.getCount();
    const rows = await qb.skip(skip).take(limit).getMany();

    return this.toPaginated(
      rows.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        status: u.status,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  async createAdmin(dto: CreateAdminDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const now = new Date();
    const user = this.userRepository.create({
      fullName: dto.fullName.trim(),
      email,
      password: hashed,
      phone: '',
      location: '',
      roleId: ADMIN_ROLE_ID,
      status: 'active',
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  async updateAdmin(id: number, dto: UpdateAdminDto, actingAdminId: number) {
    const user = await this.userRepository.findOne({ where: { id, roleId: ADMIN_ROLE_ID } });
    if (!user) {
      throw new NotFoundException('Admin not found');
    }

    if (dto.status === 'rejected' && user.status === 'active') {
      if (user.email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL) {
        throw new BadRequestException('The primary admin account cannot be deactivated');
      }
      if (id === actingAdminId) {
        throw new BadRequestException('You cannot deactivate your own account');
      }
      const activeCount = await this.userRepository.count({
        where: { roleId: ADMIN_ROLE_ID, status: 'active' },
      });
      if (activeCount <= 1) {
        throw new BadRequestException('Cannot deactivate the last active admin');
      }
    }

    if (dto.fullName?.trim()) user.fullName = dto.fullName.trim();
    if (dto.status) user.status = dto.status;
    user.updatedAt = new Date();
    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  async getAnalytics() {
    const stats = await this.getStats();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeMembers, verifiedOrganizers, publishedEvents] = await Promise.all([
      this.userRepository.count({ where: { roleId: MEMBER_ROLE_ID, status: 'active' } }),
      this.organizerProfileRepository.count({ where: { verificationStatus: 'approved' } }),
      this.eventRepository.count({ where: { status: 'published' } }),
    ]);

    return {
      overview: stats.totals,
      pending: stats.pending,
      thisMonth: stats.thisMonth,
      lastMonth: stats.lastMonth,
      trends: stats.trends,
      trendMonths: stats.trendMonths,
      eventStatusBreakdown: stats.eventStatusBreakdown,
      verificationBreakdown: stats.verificationBreakdown,
      funnel: {
        members: stats.totals.members,
        activeMembers,
        organizers: stats.totals.organizers,
        verifiedOrganizers,
        events: stats.totals.events,
        publishedEvents,
        registrations: stats.totals.registrations,
      },
      monthStart: startOfMonth.toISOString(),
    };
  }

  async getMemberDetail(id: number) {
    const user = await this.userRepository.findOne({
      where: { id, roleId: MEMBER_ROLE_ID },
    });
    if (!user) {
      throw new NotFoundException('Member not found');
    }

    const registrations = await this.registrationRepository.find({
      where: { memberId: id },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const registrationItems = await Promise.all(
      registrations.map(async (row) => {
        const event = await this.eventRepository.findOne({
          where: { id: row.eventId },
        });
        return {
          id: row.id,
          eventId: row.eventId,
          eventTitle: event?.title ?? `Event #${row.eventId}`,
          status: row.status,
          createdAt: row.createdAt,
        };
      }),
    );

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || null,
      location: user.location || null,
      status: user.status,
      emailVerified: !!user.emailVerifiedAt,
      createdAt: user.createdAt,
      registrationCount: registrations.length,
      registrations: registrationItems,
    };
  }

  async updateMemberStatus(id: number, status: string) {
    const user = await this.userRepository.findOne({
      where: { id, roleId: MEMBER_ROLE_ID },
    });
    if (!user) {
      throw new NotFoundException('Member not found');
    }
    user.status = status as User['status'];
    await this.userRepository.save(user);
    return { id: user.id, status: user.status };
  }

  async getOrganizerDetail(id: number) {
    const user = await this.userRepository.findOne({
      where: { id, roleId: ORGANIZER_ROLE_ID },
    });
    const profile = await this.organizerProfileRepository.findOne({
      where: { userId: id },
    });
    if (!user || !profile) {
      throw new NotFoundException('Organizer not found');
    }

    const [document, events, eventCount] = await Promise.all([
      this.organizerDocumentRepository.findOne({ where: { organizerId: id } }),
      this.eventRepository.find({
        where: { organizerId: id },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.eventRepository.count({ where: { organizerId: id } }),
    ]);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || null,
      userStatus: user.status,
      verificationStatus: profile.verificationStatus,
      organizationName: profile.organizationName,
      organizationDescription: profile.organizationDescription,
      website: profile.website,
      paidPublishCredits: profile.paidPublishCredits,
      rejectionReason: profile.rejectionReason,
      createdAt: profile.createdAt,
      document: document
        ? {
            documentType: document.documentType,
            documentPath: document.documentPath,
            status: document.status,
          }
        : null,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        status: event.status,
        startDatetime: event.startDatetime,
        createdAt: event.createdAt,
      })),
      eventCount,
    };
  }

  async updateOrganizerStatus(id: number, status: string) {
    const user = await this.userRepository.findOne({
      where: { id, roleId: ORGANIZER_ROLE_ID },
    });
    if (!user) {
      throw new NotFoundException('Organizer not found');
    }
    user.status = status as User['status'];
    await this.userRepository.save(user);
    return { id: user.id, status: user.status };
  }

  async getEventDetail(id: number) {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const [organizerUser, organizerProfile, registrationCount] = await Promise.all([
      this.userRepository.findOne({ where: { id: event.organizerId } }),
      this.organizerProfileRepository.findOne({
        where: { userId: event.organizerId },
      }),
      this.registrationRepository
        .createQueryBuilder('r')
        .where('r.eventId = :eventId', { eventId: id })
        .andWhere('r.status != :cancelled', { cancelled: 'cancelled' })
        .getCount(),
    ]);

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      status: event.status,
      organizerId: event.organizerId,
      organizerName:
        organizerProfile?.organizationName?.trim() ||
        organizerUser?.fullName ||
        'Organizer',
      organizerEmail: organizerUser?.email ?? '',
      locationName: event.locationName,
      locationAddress: event.locationAddress,
      capacity: event.capacity,
      audienceGender: event.audienceGender,
      startDatetime: event.startDatetime,
      endDatetime: event.endDatetime,
      createdAt: event.createdAt,
      registrationCount,
    };
  }

  async updateEventStatus(id: number, status: string) {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    event.status = status as Event['status'];
    await this.eventRepository.save(event);
    return { id: event.id, status: event.status };
  }

  async getReport(query: AdminReportQueryDto) {
    const from = query.from ? new Date(query.from) : new Date(0);
    const to = query.to ? new Date(`${query.to}T23:59:59`) : new Date();

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid date range');
    }

    switch (query.type) {
      case 'members': {
        const rows = await this.userRepository
          .createQueryBuilder('u')
          .where('u.roleId = :r', { r: MEMBER_ROLE_ID })
          .andWhere('u.createdAt >= :from AND u.createdAt <= :to', { from, to })
          .orderBy('u.createdAt', 'DESC')
          .getMany();
        return {
          type: query.type,
          from: from.toISOString(),
          to: to.toISOString(),
          total: rows.length,
          rows: rows.map((u) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            status: u.status,
            createdAt: u.createdAt,
          })),
        };
      }
      case 'organizers': {
        const profiles = await this.organizerProfileRepository
          .createQueryBuilder('p')
          .where('p.createdAt >= :from AND p.createdAt <= :to', { from, to })
          .orderBy('p.createdAt', 'DESC')
          .getMany();
        const rows = await Promise.all(
          profiles.map(async (p) => {
            const user = await this.userRepository.findOne({ where: { id: p.userId } });
            return {
              id: p.userId,
              organizationName: p.organizationName,
              email: user?.email ?? '',
              verificationStatus: p.verificationStatus,
              paidPublishCredits: p.paidPublishCredits,
              createdAt: p.createdAt,
            };
          }),
        );
        return { type: query.type, from: from.toISOString(), to: to.toISOString(), total: rows.length, rows };
      }
      case 'events': {
        const rows = await this.eventRepository
          .createQueryBuilder('e')
          .where('e.createdAt >= :from AND e.createdAt <= :to', { from, to })
          .orderBy('e.createdAt', 'DESC')
          .getMany();
        return {
          type: query.type,
          from: from.toISOString(),
          to: to.toISOString(),
          total: rows.length,
          rows: rows.map((e) => ({
            id: e.id,
            title: e.title,
            organizerId: e.organizerId,
            status: e.status,
            startDatetime: e.startDatetime,
            createdAt: e.createdAt,
          })),
        };
      }
      case 'registrations': {
        const rows = await this.registrationRepository
          .createQueryBuilder('r')
          .where('r.createdAt >= :from AND r.createdAt <= :to', { from, to })
          .orderBy('r.createdAt', 'DESC')
          .getMany();
        return {
          type: query.type,
          from: from.toISOString(),
          to: to.toISOString(),
          total: rows.length,
          rows: rows.map((r) => ({
            id: r.id,
            eventId: r.eventId,
            memberId: r.memberId,
            status: r.status,
            createdAt: r.createdAt,
          })),
        };
      }
      case 'revenue': {
        const rows = await this.paymentRequestRepository
          .createQueryBuilder('p')
          .where('p.status = :s', { s: 'approved' })
          .andWhere('p.createdAt >= :from AND p.createdAt <= :to', { from, to })
          .orderBy('p.createdAt', 'DESC')
          .getMany();
        const totalUsd = rows.reduce((sum, r) => sum + Number(r.amountUsd), 0);
        return {
          type: query.type,
          from: from.toISOString(),
          to: to.toISOString(),
          total: rows.length,
          totalUsd,
          rows: rows.map((r) => ({
            id: r.id,
            organizerId: r.organizerId,
            plan: r.plan,
            amountUsd: Number(r.amountUsd),
            creditsGranted: r.creditsGranted,
            createdAt: r.createdAt,
          })),
        };
      }
      default:
        throw new BadRequestException('Unknown report type');
    }
  }
}
