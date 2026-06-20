import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import * as bcrypt from 'bcrypt';

const ROLE_MEMBER = 1;
const ROLE_ORGANIZER = 2;
const ROLE_ADMIN = 3;

function canViewerSeeHiddenProfile(
  viewer?: { userId?: number; role?: number } | null,
): boolean {
  const role = viewer?.role != null ? Number(viewer.role) : null;
  return role === ROLE_ORGANIZER || role === ROLE_ADMIN;
}

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MemberProfile)
    private profileRepository: Repository<MemberProfile>,
    private configService: ConfigService,
  ) {}

  // member.controller.ts

  async findAll(
    viewer?: { userId?: number; role?: number } | null,
  ): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find();
    return users.map((user) => this.applyHiddenProfileRules(user, viewer));
  }

  async findOne(
    id: number,
    viewer?: { userId?: number; role?: number } | null,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.assertMemberExists(id);
    return this.applyHiddenProfileRules(user, viewer);
  }

  async getMemberInterests(
    memberId: number,
    viewer?: { userId?: number; role?: number } | null,
  ) {
    await this.assertMemberViewable(memberId, viewer);

    const interests = await this.userRepository.query(
      `SELECT i.id, i.name
       FROM member_interests mi
       INNER JOIN interests i ON i.id = mi.interest_id
       WHERE mi.member_id = ?
       ORDER BY i.id ASC`,
      [memberId],
    );

    return { interests };
  }

  async getMemberJoinedEvents(
    memberId: number,
    viewer?: { userId?: number; role?: number } | null,
  ) {
    await this.assertMemberViewable(memberId, viewer);

    const rows = await this.userRepository.query(
      `SELECT e.id,
              e.title,
              e.start_datetime AS startDatetime,
              e.end_datetime AS endDatetime,
              e.cover_image AS coverImage,
              e.location_name AS locationName,
              e.location_address AS locationAddress,
              e.is_physical AS isPhysical,
              e.total_price AS totalPrice,
              e.capacity,
              e.event_format AS eventFormat,
              i.name AS categoryName
       FROM event_registrations r
       INNER JOIN events e ON e.id = r.event_id
       LEFT JOIN interests i ON i.id = e.interest_id
       WHERE r.member_id = ? AND e.status = 'published'
       ORDER BY e.start_datetime ASC
       LIMIT 50`,
      [memberId],
    );

    return {
      items: (rows as Record<string, unknown>[]).map((row) =>
        this.mapPublicEventRow(row, { isJoined: true }),
      ),
    };
  }

  async getMemberSavedEvents(
    memberId: number,
    viewer?: { userId?: number; role?: number } | null,
  ) {
    await this.assertMemberViewable(memberId, viewer);

    const rows = await this.userRepository.query(
      `SELECT e.id,
              e.title,
              e.start_datetime AS startDatetime,
              e.end_datetime AS endDatetime,
              e.cover_image AS coverImage,
              e.location_name AS locationName,
              e.location_address AS locationAddress,
              e.is_physical AS isPhysical,
              e.total_price AS totalPrice,
              e.capacity,
              e.event_format AS eventFormat,
              i.name AS categoryName
       FROM saved_events s
       INNER JOIN events e ON e.id = s.event_id
       LEFT JOIN interests i ON i.id = e.interest_id
       WHERE s.user_id = ? AND e.status = 'published'
       ORDER BY s.saved_at DESC
       LIMIT 50`,
      [memberId],
    );

    return {
      items: (rows as Record<string, unknown>[]).map((row) =>
        this.mapPublicEventRow(row, { isSaved: true }),
      ),
    };
  }

  private mapPublicEventRow(
    row: Record<string, unknown>,
    flags: { isJoined?: boolean; isSaved?: boolean } = {},
  ) {
    const coverRaw = row.coverImage;
    const coverImage =
      typeof coverRaw === 'string' && coverRaw.trim()
        ? coverRaw.trim().startsWith('/')
          ? coverRaw.trim()
          : `/uploads/${coverRaw.trim()}`
        : null;
    const startDt = row.startDatetime;
    const endDt = row.endDatetime;
    const totalPrice = Number(row.totalPrice) || 0;

    return {
      id: String(row.id),
      title: row.title,
      startsAt:
        startDt instanceof Date
          ? startDt.toISOString()
          : startDt
            ? new Date(String(startDt)).toISOString()
            : null,
      endsAt:
        endDt instanceof Date
          ? endDt.toISOString()
          : endDt
            ? new Date(String(endDt)).toISOString()
            : null,
      coverImageUrl: coverImage,
      locationName: row.locationName ?? null,
      locationAddress: row.locationAddress ?? null,
      isOnline: !row.isPhysical,
      isPhysical: Boolean(row.isPhysical),
      priceType: totalPrice > 0 ? 'Paid' : 'Free',
      priceAmount: totalPrice,
      categoryName: row.categoryName ?? null,
      eventFormat: row.eventFormat ?? null,
      goingCount: 0,
      isJoined: Boolean(flags.isJoined),
      isSaved: Boolean(flags.isSaved),
    };
  }

  private async assertMemberExists(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async assertMemberViewable(
    memberId: number,
    viewer?: { userId?: number; role?: number } | null,
  ): Promise<User> {
    const user = await this.assertMemberExists(memberId);
    const viewerId = viewer?.userId != null ? Number(viewer.userId) : null;
    const isSelf = viewerId != null && viewerId === memberId;

    if (user.profileHidden && !isSelf && !canViewerSeeHiddenProfile(viewer)) {
      throw new NotFoundException('Profile not available');
    }

    return user;
  }

  async register(
    createMemberDto: CreateMemberDto,
  ): Promise<Omit<User, 'password'>> {
    const emailNorm = createMemberDto.email.trim().toLowerCase();
    const phoneNorm = (createMemberDto.phone ?? '').trim();
    const lookup: FindOptionsWhere<User>[] = [{ email: emailNorm }];
    if (phoneNorm) {
      lookup.push({ phone: phoneNorm });
    }

    const existingUser = await this.userRepository.findOne({
      where: lookup,
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === emailNorm) {
        throw new BadRequestException('Email already exists');
      }

      if (phoneNorm && existingUser.phone === phoneNorm) {
        throw new BadRequestException('Phone already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(
      createMemberDto.password,
      this.getSaltRounds(),
    );

    const user = this.userRepository.create({
      fullName: createMemberDto.full_name,
      email: emailNorm,
      password: hashedPassword,
      phone: phoneNorm,
      roleId: 1, // 🔥 member role
      status: 'active',
    });
    const savedUser = await this.userRepository.save(user);

    const profile = this.profileRepository.create({
      userId: savedUser.id,
      profileCompleted: false,
    });
    await this.profileRepository.save(profile);

    return this.toSafeUser(savedUser);
  }

  async update(
    id: number,
    dto: UpdateMemberDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 🔍 Check email / phone uniqueness
    if (dto.email || dto.phone) {
      const conditions: FindOptionsWhere<User>[] = [];

      if (dto.email) conditions.push({ email: dto.email });
      if (dto.phone) conditions.push({ phone: dto.phone });

      const existingUser = await this.userRepository.findOne({
        where: conditions,
      });

      if (existingUser && existingUser.id !== id) {
        if (dto.email && existingUser.email === dto.email) {
          throw new BadRequestException('Email already exists');
        }

        if (dto.phone && existingUser.phone === dto.phone) {
          throw new BadRequestException('Phone already exists');
        }
      }
    }

    // 🔐 Password
    if (dto.password && dto.password.trim() !== '') {
      user.password = await bcrypt.hash(dto.password, this.getSaltRounds());
    }

    // 🔄 Update fields
    user.fullName = dto.full_name ?? user.fullName;

    if (dto.email) user.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) {
      const trimmed = (dto.phone ?? '').trim();
      user.phone = trimmed.length > 0 ? trimmed : '';
    }

    if (dto.location !== undefined) {
      const loc = (dto.location ?? '').trim();
      user.location = loc.length > 0 ? loc : '';
    }

    if (dto.profile_show_email !== undefined) {
      user.profileShowEmail = Boolean(dto.profile_show_email);
    }
    if (dto.profile_show_phone !== undefined) {
      user.profileShowPhone = Boolean(dto.profile_show_phone);
    }
    if (dto.profile_hidden !== undefined) {
      user.profileHidden = Boolean(dto.profile_hidden);
    }

    if (dto.social_website !== undefined) {
      user.socialWebsite = this.normalizeOptionalUrl(dto.social_website);
    }
    if (dto.social_linkedin !== undefined) {
      user.socialLinkedin = this.normalizeOptionalUrl(dto.social_linkedin);
    }
    if (dto.social_instagram !== undefined) {
      user.socialInstagram = this.normalizeOptionalUrl(dto.social_instagram);
    }
    if (dto.social_facebook !== undefined) {
      user.socialFacebook = this.normalizeOptionalUrl(dto.social_facebook);
    }
    if (dto.social_tiktok !== undefined) {
      user.socialTiktok = this.normalizeOptionalUrl(dto.social_tiktok);
    }

    const savedUser = await this.userRepository.save(user);
    const fresh = await this.userRepository.findOne({ where: { id } });
    return this.toSafeUser(fresh ?? savedUser);
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);

    return { message: 'User deleted successfully' };
  }

  private getSaltRounds(): number {
    const configured = this.configService.get<string>(
      'BCRYPT_SALT_ROUNDS',
      '12',
    );
    const parsed = Number(configured);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
  }

  private toSafeUser(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private applyHiddenProfileRules(
    user: User,
    viewer?: { userId?: number; role?: number } | null,
  ): Omit<User, 'password'> {
    const safe = this.toSafeUser(user);
    const viewerId = viewer?.userId != null ? Number(viewer.userId) : null;
    const isSelf = viewerId != null && viewerId === user.id;

    if (!safe.profileHidden || isSelf) {
      return safe;
    }

    if (canViewerSeeHiddenProfile(viewer)) {
      return {
        ...safe,
        email: '',
        phone: '',
        profileShowEmail: false,
        profileShowPhone: false,
        ...this.emptySocialLinks(),
      };
    }

    return {
      ...safe,
      fullName: 'Anonymous',
      profileImg: '',
      location: '',
      email: '',
      phone: '',
      profileShowEmail: false,
      profileShowPhone: false,
      ...this.emptySocialLinks(),
    };
  }

  private normalizeOptionalUrl(value: unknown): string {
    const trimmed = String(value ?? '').trim();
    return trimmed.length > 0 ? trimmed : '';
  }

  private emptySocialLinks() {
    return {
      socialWebsite: '',
      socialLinkedin: '',
      socialInstagram: '',
      socialFacebook: '',
      socialTiktok: '',
    };
  }

  private toSafeUsers(users: User[]): Omit<User, 'password'>[] {
    return users.map((user) => this.toSafeUser(user));
  }
}
