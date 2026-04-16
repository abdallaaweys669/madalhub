import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';
import { MemberInterest } from 'src/database/entities/member-interest.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { InterestsDto } from '../dto/interests.dto';
import { UpdateOrganizerProfileDto } from '../dto/update-organizer-profile.dto';
import { isProfileComplete } from '../helpers/organizer-profile.helper';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MemberProfile)
    private profileRepository: Repository<MemberProfile>,
    @InjectRepository(MemberInterest)
    private interestRepository: Repository<MemberInterest>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    @InjectRepository(OrganizerVerificationDocument)
    private organizerDocumentRepository: Repository<OrganizerVerificationDocument>,
  ) {}

  isProfileComplete(profile: OrganizerProfile): boolean {
    return isProfileComplete(profile);
  }

  private async resolveDocumentType(input: string): Promise<string> {
    const value = input?.trim();

    if (!value) {
      throw new BadRequestException('document_type is required');
    }

    const columnRows: Array<{ Type: string }> =
      await this.organizerDocumentRepository.query(
        "SHOW COLUMNS FROM organizer_verification_documents LIKE 'document_type'",
      );

    const columnType = columnRows?.[0]?.Type ?? '';

    if (!columnType.toLowerCase().startsWith('enum(')) {
      return value;
    }

    const enumValues = [...columnType.matchAll(/'([^']*)'/g)].map(
      (match) => match[1],
    );

    const direct = enumValues.find(
      (enumValue) => enumValue.toLowerCase() === value.toLowerCase(),
    );

    if (direct) {
      return direct;
    }

    const aliases: Record<string, string> = {
      licence: 'license',
    };

    const aliasTarget = aliases[value.toLowerCase()];
    if (aliasTarget) {
      const aliasMatch = enumValues.find(
        (enumValue) => enumValue.toLowerCase() === aliasTarget,
      );
      if (aliasMatch) {
        return aliasMatch;
      }
    }

    throw new BadRequestException(
      `Invalid document_type. Allowed values: ${enumValues.join(', ')}`,
    );
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.location !== undefined) {
      user.location = dto.location;
      await this.userRepository.save(user);
    }

    let profile = await this.profileRepository.findOne({ where: { userId } });
    const wantsProfileUpdate = dto.gender !== undefined || dto.dob !== undefined;

    if (!profile && wantsProfileUpdate) {
      profile = this.profileRepository.create({
        userId,
        profileCompleted: false,
      });
    }

    if (profile && wantsProfileUpdate) {
      if (dto.gender !== undefined) {
        profile.gender = dto.gender;
      }

      if (dto.dob !== undefined) {
        profile.dob = dto.dob;
      }

      await this.profileRepository.save(profile);
    }

    const latestProfile =
      profile ??
      (await this.profileRepository.findOne({ where: { userId } }));

    return {
      userId,
      location: user.location ?? null,
      gender: latestProfile?.gender ?? null,
      dob: latestProfile?.dob ?? null,
      profileCompleted: latestProfile?.profileCompleted ?? false,
    };
  }

  async updateInterests(userId: number, dto: InterestsDto) {
    await this.interestRepository.delete({ userId });

    const rows = dto.interestIds.map((interestId) =>
      this.interestRepository.create({
        userId,
        interestId,
      }),
    );

    if (rows.length > 0) {
      await this.interestRepository.save(rows);
    }

    let profile = await this.profileRepository.findOne({ where: { userId } });

    if (!profile) {
      profile = this.profileRepository.create({
        userId,
        profileCompleted: true,
      });
    } else {
      profile.profileCompleted = true;
    }

    await this.profileRepository.save(profile);

    return {
      userId,
      interestIds: dto.interestIds,
      profileCompleted: profile.profileCompleted,
    };
  }

  async updateOrganizerProfile(userId: number, dto: UpdateOrganizerProfileDto) {
    const profile = await this.organizerProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Organizer profile not found');
    }

    if (dto.organization_name !== undefined) {
      profile.organization_name = dto.organization_name;
    }

    if (dto.organization_description !== undefined) {
      profile.organization_description = dto.organization_description;
    }

    if (dto.website !== undefined) {
      profile.website = dto.website;
    }

    const savedProfile = await this.organizerProfileRepository.save(profile);

    return {
      user_id: savedProfile.user_id,
      organization_name: savedProfile.organization_name ?? null,
      organization_description: savedProfile.organization_description ?? null,
      website: savedProfile.website ?? null,
      verification_status: savedProfile.verification_status,
      profileCompleted: this.isProfileComplete(savedProfile),
    };
  }

  async upsertOrganizerDocument(
    userId: number,
    file: any,
    documentType: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const resolvedDocumentType = await this.resolveDocumentType(documentType);

    const filePath = `/uploads/${file.filename}`;

    const documents = await this.organizerDocumentRepository.find({
      where: { organizer_id: userId },
      order: { id: 'ASC' },
    });

    if (documents.length > 1) {
      throw new BadRequestException(
        'Multiple organizer documents found. Only one document is allowed per organizer.',
      );
    }

    const existingDocument = documents[0];

    if (existingDocument) {
      existingDocument.document_type = resolvedDocumentType;
      existingDocument.document_path = filePath;
      existingDocument.status = 'pending';
      existingDocument.uploaded_at = new Date();

      const updated = await this.organizerDocumentRepository.save(existingDocument);
      return {
        id: updated.id,
        organizer_id: updated.organizer_id,
        document_type: updated.document_type,
        document_path: updated.document_path,
        status: updated.status,
        uploaded_at: updated.uploaded_at,
        mode: 'updated',
      };
    }

    const created = this.organizerDocumentRepository.create({
      organizer_id: userId,
      document_type: resolvedDocumentType,
      document_path: filePath,
      status: 'pending',
      uploaded_at: new Date(),
    });

    const saved = await this.organizerDocumentRepository.save(created);

    return {
      id: saved.id,
      organizer_id: saved.organizer_id,
      document_type: saved.document_type,
      document_path: saved.document_path,
      status: saved.status,
      uploaded_at: saved.uploaded_at,
      mode: 'created',
    };
  }
}
