import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrganizerDto } from '../dto/create-organizer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { Event } from 'src/database/entities/event.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { OrganizerFollow } from 'src/database/entities/organizer-follow.entity';
import { OrganizerReview } from 'src/database/entities/organizer-review.entity';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { SocialLoginDto } from '../dto/social-login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'crypto';

@Injectable()
export class OrganizerService {
  private googleClient = new OAuth2Client();
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    @InjectRepository(OrganizerVerificationDocument)
    private organizerDocumentRepository: Repository<OrganizerVerificationDocument>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventRegistration)
    private eventRegistrationRepository: Repository<EventRegistration>,
    @InjectRepository(OrganizerFollow)
    private organizerFollowRepository: Repository<OrganizerFollow>,
    @InjectRepository(OrganizerReview)
    private organizerReviewRepository: Repository<OrganizerReview>,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateOrganizerDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (existingUser) {
      throw new BadRequestException('Email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const resolvedName = (dto.full_name || '').trim() || 'Organizer';

    const organizer = this.userRepository.create({
      fullName: resolvedName,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      phone: dto.phone || '',
      location: dto.location || '',
      roleId: 2,
      status: 'pending',
    });

    const saved = await this.userRepository.save(organizer);

    const organizerProfile = this.organizerProfileRepository.create({
      userId: saved.id,
      organizationName: '',
      organizationDescription: '',
      website: '',
      verificationStatus: 'pending',
      createdAt: new Date(),
    });
    await this.organizerProfileRepository.save(organizerProfile);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safe } = saved;
    return safe;
  }

  async updateContact(userId: number, dto: { phone?: string; location?: string }) {
    const user = await this.userRepository.findOne({ where: { id: userId, roleId: 2 } });
    if (!user) {
      throw new NotFoundException('Organizer not found');
    }

    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.location !== undefined) user.location = dto.location;
    await this.userRepository.save(user);

    return {
      userId: user.id,
      phone: user.phone ?? null,
      location: user.location ?? null,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'roleId', 'password', 'status', 'email'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.roleId !== 2) {
      throw new UnauthorizedException(
        'This account is not registered as an organizer. Use member login instead.',
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueOrganizerToken(user);
  }

  private async issueOrganizerToken(user: Pick<User, 'id' | 'roleId' | 'email' | 'status'>) {
    const payload = {
      sub: user.id,
      role: user.roleId,
      email: user.email,
      status: user.status,
    };

    const organizerProfile = await this.organizerProfileRepository.findOne({
      where: { userId: user.id },
    });

    return {
      access_token: this.jwtService.sign(payload),
      organizerStatus: organizerProfile?.verificationStatus ?? 'pending',
      rejectionReason: organizerProfile?.rejectionReason ?? null,
    };
  }

  async socialLogin(dto: SocialLoginDto) {
    let providerEmail = '';
    let providerName = '';

    if (dto.provider === 'google') {
      if (!dto.idToken) {
        throw new BadRequestException('Google idToken is required');
      }
      const audience = this.configService.get<string>('GOOGLE_WEB_CLIENT_ID');
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: audience || undefined,
      });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw new BadRequestException('Google account email is required');
      }
      providerEmail = String(payload.email).trim().toLowerCase();
      providerName = String(payload.name || '').trim();
    } else {
      if (!dto.accessToken) {
        throw new BadRequestException('Facebook accessToken is required');
      }
      const fbResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(dto.accessToken)}`,
      );
      const fbData = (await fbResponse.json()) as { email?: string; name?: string; error?: { message?: string } };
      if (!fbResponse.ok || fbData?.error) {
        throw new BadRequestException(fbData?.error?.message || 'Invalid Facebook token');
      }
      if (!fbData?.email) {
        throw new BadRequestException('Facebook email permission is required');
      }
      providerEmail = String(fbData.email).trim().toLowerCase();
      providerName = String(fbData.name || '').trim();
    }

    const fallbackName =
      (dto.fullName || '').trim() ||
      providerName ||
      (dto.email || '').split('@')[0] ||
      'Organizer';

    let user: { id: number; roleId: number; status: string; email: string } | null =
      await this.userRepository.findOne({
      where: { email: providerEmail },
      select: ['id', 'roleId', 'status', 'email'],
    });

    if (!user) {
      const randomPassword = await bcrypt.hash(`social-${randomUUID()}`, 10);
      const created = this.userRepository.create({
        fullName: fallbackName,
        email: providerEmail,
        password: randomPassword,
        phone: '',
        location: '',
        roleId: 2,
        status: 'pending',
      });
      const saved = await this.userRepository.save(created);
      await this.organizerProfileRepository.save(
        this.organizerProfileRepository.create({
          userId: saved.id,
          organizationName: '',
          organizationDescription: '',
          website: '',
          verificationStatus: 'pending',
          createdAt: new Date(),
        }),
      );
      user = { id: saved.id, roleId: saved.roleId, status: saved.status, email: saved.email };
    }

    if (user.roleId !== 2) {
      throw new UnauthorizedException('This account is not registered as an organizer.');
    }

    return this.issueOrganizerToken(user);
  }

  async getStatus(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'roleId', 'status', 'email', 'fullName'],
    });

    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer profile not found');
    }

    const organizerProfile = await this.organizerProfileRepository.findOne({
      where: { userId },
    });

    const document = await this.organizerDocumentRepository.findOne({
      where: { organizerId: userId },
      order: { id: 'DESC' },
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      userStatus: user.status,
      verificationStatus: organizerProfile?.verificationStatus ?? 'pending',
      rejectionReason: organizerProfile?.rejectionReason ?? null,
      organizationName: organizerProfile?.organizationName ?? null,
      organizationDescription: organizerProfile?.organizationDescription ?? null,
      hasDocument: !!document,
      documentStatus: document?.status ?? null,
    };
  }

  async getMyEvents(userId: number, status?: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    const where: Record<string, unknown> = { organizerId: userId };
    if (status) {
      where.status = status;
    }

    const events = await this.eventRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    const registrationCountByEventId = new Map<number, number>();
    if (events.length > 0) {
      const ids = events.map((e) => e.id);
      const rows = await this.eventRegistrationRepository
        .createQueryBuilder('reg')
        .select('reg.eventId', 'eventId')
        .addSelect('COUNT(reg.id)', 'cnt')
        .where('reg.eventId IN (:...ids)', { ids })
        .groupBy('reg.eventId')
        .getRawMany<{ eventId: number; cnt: string }>();
      for (const row of rows) {
        registrationCountByEventId.set(Number(row.eventId), Number(row.cnt));
      }
    }

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      status: event.status,
      startsAt: event.startDatetime,
      endsAt: event.endDatetime,
      locationName: event.locationName,
      capacity: event.capacity,
      totalPrice: event.totalPrice,
      isPhysical: event.isPhysical,
      coverImage: event.coverImage ?? null,
      registrationCount: registrationCountByEventId.get(event.id) ?? 0,
    }));
  }

  async getProfileDashboard(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    const organizerProfile = await this.organizerProfileRepository.findOne({
      where: { userId },
    });

    const events = await this.eventRepository.find({
      where: { organizerId: userId },
    });
    const eventsCount = events.length;

    let attendeesTotal = 0;
    if (events.length > 0) {
      const ids = events.map((e) => e.id);
      const attendeeRows = await this.eventRegistrationRepository
        .createQueryBuilder('reg')
        .select('COUNT(reg.id)', 'cnt')
        .where('reg.eventId IN (:...ids)', { ids })
        .getRawOne<{ cnt: string }>();
      attendeesTotal = attendeeRows ? Number(attendeeRows.cnt) : 0;
    }

    const followersCount = await this.organizerFollowRepository.count({
      where: { organizerId: userId },
    });

    const ratingStats = await this.organizerReviewRepository
      .createQueryBuilder('rev')
      .select('AVG(rev.rating)', 'avg')
      .addSelect('COUNT(rev.id)', 'cnt')
      .where('rev.organizerId = :organizerId', { organizerId: userId })
      .getRawOne<{ avg: string | null; cnt: string }>();

    const ratingAverage = ratingStats?.avg ? Number(Number(ratingStats.avg).toFixed(1)) : null;
    const ratingCount = ratingStats ? Number(ratingStats.cnt) : 0;

    const recentFollowRows = await this.organizerFollowRepository
      .createQueryBuilder('f')
      .leftJoin(User, 'u', 'u.id = f.memberId')
      .select([
        'f.memberId AS memberId',
        'u.full_name AS fullName',
        'u.profile_img AS profileImg',
      ])
      .where('f.organizerId = :organizerId', { organizerId: userId })
      .orderBy('f.createdAt', 'DESC')
      .limit(4)
      .getRawMany<{ memberId: number; fullName: string; profileImg: string | null }>();

    const recentFollowers = recentFollowRows.map((r) => ({
      memberId: Number(r.memberId),
      fullName: r.fullName ?? 'Member',
      profileImg: r.profileImg ?? null,
    }));

    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      location: user.location ?? null,
      profileImg: user.profileImg ?? null,
      organizationName: organizerProfile?.organizationName ?? null,
      organizationDescription: organizerProfile?.organizationDescription ?? null,
      website: organizerProfile?.website ?? null,
      verificationStatus: organizerProfile?.verificationStatus ?? 'pending',
      rejectionReason: organizerProfile?.rejectionReason ?? null,
      eventsCount,
      attendeesTotal,
      followersCount,
      ratingAverage,
      ratingCount,
      recentFollowers,
    };
  }

  async followOrganizer(organizerId: number, memberId: number) {
    const organizer = await this.userRepository.findOne({
      where: { id: organizerId, roleId: 2 },
    });
    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    const member = await this.userRepository.findOne({
      where: { id: memberId, roleId: 1 },
    });
    if (!member) {
      throw new BadRequestException('Only members can follow organizers');
    }

    const existing = await this.organizerFollowRepository.findOne({
      where: { organizerId, memberId },
    });
    if (existing) {
      throw new BadRequestException('Already following this organizer');
    }

    const follow = this.organizerFollowRepository.create({
      organizerId,
      memberId,
      createdAt: new Date(),
    });
    await this.organizerFollowRepository.save(follow);

    return { message: 'Following organizer', organizerId, memberId };
  }

  async unfollowOrganizer(organizerId: number, memberId: number) {
    const existing = await this.organizerFollowRepository.findOne({
      where: { organizerId, memberId },
    });
    if (!existing) {
      throw new NotFoundException('Not following this organizer');
    }

    await this.organizerFollowRepository.remove(existing);
    return { message: 'Unfollowed organizer' };
  }

  async getFollowers(organizerId: number) {
    const rows = await this.organizerFollowRepository
      .createQueryBuilder('f')
      .leftJoin(User, 'u', 'u.id = f.memberId')
      .select([
        'f.memberId AS memberId',
        'u.full_name AS fullName',
        'u.profile_img AS profileImg',
        'f.createdAt AS followedAt',
      ])
      .where('f.organizerId = :organizerId', { organizerId })
      .orderBy('f.createdAt', 'DESC')
      .getRawMany<{ memberId: number; fullName: string; profileImg: string | null; followedAt: Date }>();

    return rows.map((r) => ({
      memberId: Number(r.memberId),
      fullName: r.fullName ?? 'Member',
      profileImg: r.profileImg ?? null,
      followedAt: r.followedAt,
    }));
  }

  async createReview(memberId: number, dto: CreateReviewDto) {
    const organizer = await this.userRepository.findOne({
      where: { id: dto.organizerId, roleId: 2 },
    });
    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    const member = await this.userRepository.findOne({
      where: { id: memberId, roleId: 1 },
    });
    if (!member) {
      throw new BadRequestException('Only members can review organizers');
    }

    const existing = await this.organizerReviewRepository.findOne({
      where: { organizerId: dto.organizerId, memberId },
    });
    if (existing) {
      throw new BadRequestException('You have already reviewed this organizer');
    }

    const review = this.organizerReviewRepository.create({
      organizerId: dto.organizerId,
      memberId,
      rating: dto.rating,
      comment: dto.comment ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await this.organizerReviewRepository.save(review);

    return {
      id: saved.id,
      organizerId: saved.organizerId,
      memberId: saved.memberId,
      rating: saved.rating,
      comment: saved.comment,
      createdAt: saved.createdAt,
    };
  }

  async updateReview(memberId: number, reviewId: number, dto: UpdateReviewDto) {
    const review = await this.organizerReviewRepository.findOne({
      where: { id: reviewId, memberId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (dto.rating !== undefined) {
      review.rating = dto.rating;
    }
    if (dto.comment !== undefined) {
      review.comment = dto.comment;
    }
    review.updatedAt = new Date();

    const saved = await this.organizerReviewRepository.save(review);

    return {
      id: saved.id,
      organizerId: saved.organizerId,
      memberId: saved.memberId,
      rating: saved.rating,
      comment: saved.comment,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async deleteReview(memberId: number, reviewId: number) {
    const review = await this.organizerReviewRepository.findOne({
      where: { id: reviewId, memberId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.organizerReviewRepository.remove(review);
    return { message: 'Review deleted' };
  }

  async getOrganizerReviews(organizerId: number) {
    const rows = await this.organizerReviewRepository
      .createQueryBuilder('rev')
      .leftJoin(User, 'u', 'u.id = rev.memberId')
      .select([
        'rev.id AS id',
        'rev.organizerId AS organizerId',
        'rev.memberId AS memberId',
        'rev.rating AS rating',
        'rev.comment AS comment',
        'rev.createdAt AS createdAt',
        'rev.updatedAt AS updatedAt',
        'u.full_name AS memberName',
        'u.profile_img AS memberProfileImg',
      ])
      .where('rev.organizerId = :organizerId', { organizerId })
      .orderBy('rev.createdAt', 'DESC')
      .getRawMany<{
        id: number;
        organizerId: number;
        memberId: number;
        rating: number;
        comment: string | null;
        createdAt: Date;
        updatedAt: Date;
        memberName: string;
        memberProfileImg: string | null;
      }>();

    return rows.map((r) => ({
      id: Number(r.id),
      organizerId: Number(r.organizerId),
      memberId: Number(r.memberId),
      rating: Number(r.rating),
      comment: r.comment,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      memberName: r.memberName ?? 'Member',
      memberProfileImg: r.memberProfileImg ?? null,
    }));
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }
}
