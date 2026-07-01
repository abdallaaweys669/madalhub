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
import {
  assertMinimumMemberAge,
  parseDobInput,
} from '../helpers/member-age.helper';

const ORGANIZER_ROLE_ID = 2;

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

  /**
   * After admin rejection, a new document upload completes resubmission:
   * profile + user go back to pending review.
   */
  private async resetVerificationAfterResubmit(userId: number): Promise<void> {
    const profile = await this.organizerProfileRepository.findOne({
      where: { userId },
    });

    if (!profile || profile.verificationStatus !== 'rejected') {
      return;
    }

    profile.verificationStatus = 'pending';
    profile.rejectionReason = null;
    await this.organizerProfileRepository.save(profile);
  }

  private async markVerificationPendingIfReady(userId: number): Promise<void> {
    const profile = await this.organizerProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) return;

    if (!['unverified', 'rejected'].includes(profile.verificationStatus)) {
      return;
    }

    if (!this.isProfileComplete(profile)) {
      return;
    }

    const document = await this.organizerDocumentRepository.findOne({
      where: { organizerId: userId },
    });
    if (!document) {
      return;
    }

    profile.verificationStatus = 'pending';
    profile.rejectionReason = null;
    await this.organizerProfileRepository.save(profile);
  }

  private normalizeDocumentTypeInput(input: string): string {
    const value = input?.trim().toLowerCase();
    if (!value) {
      throw new BadRequestException('document_type is required');
    }

    const aliasGroups: Record<string, string[]> = {
      business_license: [
        'business_license',
        'business license',
        'business',
        'license',
        'licence',
      ],
      other: ['other', 'other_document', 'other document'],
    };

    for (const [canonical, aliases] of Object.entries(aliasGroups)) {
      if (aliases.includes(value)) {
        return canonical;
      }
    }

    return value;
  }

  private async resolveDocumentType(input: string): Promise<string> {
    const normalized = this.normalizeDocumentTypeInput(input);

    const columnRows: Array<{ Type: string }> =
      await this.organizerDocumentRepository.query(
        "SHOW COLUMNS FROM organizer_verification_documents LIKE 'document_type'",
      );

    const columnType = columnRows?.[0]?.Type ?? '';

    if (!columnType.toLowerCase().startsWith('enum(')) {
      const rows: Array<{ slug: string }> = await this.organizerDocumentRepository.query(
        `SELECT slug FROM organizer_verification_document_types
         WHERE is_active = 1 AND slug = ?
         LIMIT 1`,
        [normalized],
      );
      if (!rows.length) {
        throw new BadRequestException('Invalid document_type.');
      }
      return normalized;
    }

    const enumValues = [...columnType.matchAll(/'([^']*)'/g)].map(
      (match) => match[1],
    );

    const direct = enumValues.find(
      (enumValue) => enumValue.toLowerCase() === normalized,
    );

    if (direct) {
      return direct;
    }

    if (normalized === 'business_license') {
      const license = enumValues.find(
        (enumValue) => enumValue.toLowerCase() === 'license',
      );
      if (license) {
        return license;
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
      const trimmed = String(dto.location ?? '').trim();
      user.location = trimmed;
      await this.userRepository.save(user);
      const reloaded = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (reloaded) {
        user.location = reloaded.location ?? '';
      }
    }

    let profile = await this.profileRepository.findOne({ where: { userId } });
    const wantsProfileUpdate =
      dto.gender !== undefined || dto.dob !== undefined;

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
        const parsedDob = parseDobInput(dto.dob);
        assertMinimumMemberAge(parsedDob);
        profile.dob = parsedDob;
      }

      await this.profileRepository.save(profile);
    }

    const latestProfile =
      profile ?? (await this.profileRepository.findOne({ where: { userId } }));

    const locationOut =
      user.location != null && String(user.location).trim() !== ''
        ? String(user.location).trim()
        : null;

    return {
      userId,
      location: locationOut,
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

    const profile = await this.profileRepository.findOne({ where: { userId } });

    if (!profile?.dob) {
      throw new BadRequestException(
        'Date of birth is required before completing onboarding.',
      );
    }

    assertMinimumMemberAge(parseDobInput(profile.dob));
    profile.profileCompleted = true;

    await this.profileRepository.save(profile);

    return {
      userId,
      interestIds: dto.interestIds,
      profileCompleted: profile.profileCompleted,
    };
  }

  async getInterests() {
    const interests = await this.interestRepository.query(
      'SELECT id, name, icon FROM interests ORDER BY name ASC',
    );

    return { interests };
  }

  /** Current member's selected interests (from DB), for profile / settings. */
  async getMyInterests(userId: number) {
    const interests = await this.interestRepository.query(
      `SELECT i.id, i.name, i.icon
       FROM member_interests mi
       INNER JOIN interests i ON i.id = mi.interest_id
       WHERE mi.member_id = ?
       ORDER BY i.name ASC`,
      [userId],
    );

    return { interests };
  }

  async updateOrganizerProfile(userId: number, dto: UpdateOrganizerProfileDto) {
    const profile = await this.organizerProfileRepository.findOne({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException('Organizer profile not found');
    }

    if (dto.organization_name !== undefined) {
      profile.organizationName = dto.organization_name;
    }

    if (dto.organization_description !== undefined) {
      profile.organizationDescription = dto.organization_description;
    }

    if (dto.website !== undefined) {
      profile.website = dto.website?.trim() || null;
    }

    if (dto.instagram !== undefined) {
      profile.instagram = dto.instagram?.trim() || null;
    }

    if (dto.facebook !== undefined) {
      profile.facebook = dto.facebook?.trim() || null;
    }

    const savedProfile = await this.organizerProfileRepository.save(profile);
    await this.markVerificationPendingIfReady(userId);

    return {
      userId: savedProfile.userId,
      organizationName: savedProfile.organizationName ?? null,
      organizationDescription: savedProfile.organizationDescription ?? null,
      website: savedProfile.website ?? null,
      instagram: savedProfile.instagram ?? null,
      facebook: savedProfile.facebook ?? null,
      verificationStatus: savedProfile.verificationStatus,
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
      where: { organizerId: userId },
      order: { id: 'ASC' },
    });

    if (documents.length > 1) {
      throw new BadRequestException(
        'Multiple organizer documents found. Only one document is allowed per organizer.',
      );
    }

    const existingDocument = documents[0];

    if (existingDocument) {
      existingDocument.documentType = resolvedDocumentType;
      existingDocument.documentTypeSlug = resolvedDocumentType;
      existingDocument.documentPath = filePath;
      existingDocument.status = 'pending';
      existingDocument.uploadedAt = new Date();

      const updated =
        await this.organizerDocumentRepository.save(existingDocument);
      await this.resetVerificationAfterResubmit(userId);
      await this.markVerificationPendingIfReady(userId);
      return {
        id: updated.id,
        organizerId: updated.organizerId,
        documentType: updated.documentType,
        documentPath: updated.documentPath,
        status: updated.status,
        uploadedAt: updated.uploadedAt,
        mode: 'updated',
      };
    }

    const created = this.organizerDocumentRepository.create({
      organizerId: userId,
      documentType: resolvedDocumentType,
      documentTypeSlug: resolvedDocumentType,
      documentPath: filePath,
      status: 'pending',
      uploadedAt: new Date(),
    });

    const saved = await this.organizerDocumentRepository.save(created);

    await this.resetVerificationAfterResubmit(userId);
    await this.markVerificationPendingIfReady(userId);

    return {
      id: saved.id,
      organizerId: saved.organizerId,
      documentType: saved.documentType,
      documentPath: saved.documentPath,
      status: saved.status,
      uploadedAt: saved.uploadedAt,
      mode: 'created',
    };
  }

  async updateOrganizerProfileImage(userId: number, file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.profileImg = `/uploads/${file.filename}`;
    await this.userRepository.save(user);

    return {
      userId,
      profileImg: user.profileImg,
    };
  }

  async updateMemberProfileImage(userId: number, file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.roleId !== 1) {
      throw new BadRequestException('Only members can use this endpoint');
    }

    user.profileImg = `/uploads/${file.filename}`;
    await this.userRepository.save(user);

    return {
      userId,
      profileImg: user.profileImg,
    };
  }
}
