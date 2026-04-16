import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    where: { user_id: user.id },
  });

  if (!organizerProfile) {
    throw new BadRequestException('Organizer profile not found');
  }

  if (!this.isProfileComplete(organizerProfile)) {
    throw new BadRequestException('Organizer profile is incomplete');
  }

  const documents = await this.organizerDocumentRepository.find({
    where: { organizer_id: user.id },
    select: ['id'],
  });

  if (documents.length !== 1) {
    throw new BadRequestException(
      'Organizer must have exactly one verification document before approval',
    );
  }

  user.status = 'active';
  organizerProfile.verification_status = 'approved';

  await this.organizerProfileRepository.save(organizerProfile);
  return this.userRepository.save(user);
}

async rejectOrganizer(id: number) {
  const user = await this.userRepository.findOne({ where: { id } });

  if (!user || user.roleId !== 2) {
    throw new NotFoundException('Organizer not found');
  }

  user.status = 'rejected';
  return this.userRepository.save(user);
}

async getPendingOrganizers() {
  const users = await this.userRepository.find({
    where: {
      roleId: 2,          // organizer
      status: 'pending',  // waiting approval
    },
  });

  return Promise.all(
    users.map(async (user) => {
      const profile = await this.organizerProfileRepository.findOne({
        where: { user_id: user.id },
      });

      const document = await this.organizerDocumentRepository.findOne({
        where: { organizer_id: user.id },
      });

      return {
        ...user,
        profile: profile
          ? {
              organization_name: profile.organization_name,
              organization_description: profile.organization_description,
              website: profile.website,
            }
          : null,
        document: document
          ? {
              document_type: document.document_type,
              document_path: document.document_path,
              status: document.status,
            }
          : null,
      };
    }),
  );
}
}
