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
import { Repository } from 'typeorm';
import { isProfileComplete } from 'src/onboarding/helpers/organizer-profile.helper';
import { ConfigService } from '@nestjs/config';

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
    private configService: ConfigService,
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

    return {
      id: request.id,
      organizerId: request.organizerId,
      creditsGranted: credits,
      paidPublishCredits: profile.paidPublishCredits,
      message: 'Payment approved and publish credits granted.',
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

    return {
      id: request.id,
      status: request.status,
      adminNote: request.adminNote,
    };
  }
}
