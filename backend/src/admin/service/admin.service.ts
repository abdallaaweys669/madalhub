import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { Repository } from 'typeorm';
import { isProfileComplete } from 'src/onboarding/helpers/organizer-profile.helper';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    @InjectRepository(OrganizerVerificationDocument)
    private organizerDocumentRepository: Repository<OrganizerVerificationDocument>,
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

    user.status = 'rejected';
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
    const users = await this.userRepository.find({
      where: {
        roleId: 2, // organizer
        status: 'pending', // waiting approval
      },
    });

    return Promise.all(
      users.map(async (user) => {
        const profile = await this.organizerProfileRepository.findOne({
          where: { userId: user.id },
        });

        const document = await this.organizerDocumentRepository.findOne({
          where: { organizerId: user.id },
        });

        return {
          ...user,
          profile: profile
            ? {
                organizationName: profile.organizationName,
                organizationDescription: profile.organizationDescription,
                website: profile.website,
              }
            : null,
          document: document
            ? {
                documentType: document.documentType,
                documentPath: document.documentPath,
                status: document.status,
              }
            : null,
        };
      }),
    );
  }
}
