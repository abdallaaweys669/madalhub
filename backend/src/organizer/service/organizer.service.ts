import {
  BadRequestException,
  ForbiddenException,
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
import { OrganizerPaymentRequest } from 'src/database/entities/organizer-payment-request.entity';
import { OrganizerCreditRequest } from 'src/database/entities/organizer-credit-request.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'crypto';
import { computePublishEligibility } from '../helpers/publish-eligibility.helper';
import { CreateOrganizerPaymentRequestDto } from '../dto/create-payment-request.dto';
import { CreateOrganizerCreditRequestDto } from '../dto/create-organizer-credit-request.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { SocialLoginDto } from '../dto/social-login.dto';
import { isProfileComplete } from 'src/onboarding/helpers/organizer-profile.helper';
import { NotificationsService } from 'src/notifications/notifications.service';

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
    @InjectRepository(OrganizerPaymentRequest)
    private paymentRequestRepository: Repository<OrganizerPaymentRequest>,
    @InjectRepository(OrganizerCreditRequest)
    private creditRequestRepository: Repository<OrganizerCreditRequest>,
    private configService: ConfigService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  private async assertOrganizerOwnsEvent(organizerId: number, eventId: number) {
    const user = await this.userRepository.findOne({ where: { id: organizerId } });
    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event || event.organizerId !== organizerId) {
      throw new ForbiddenException('You do not own this event');
    }

    return event;
  }

  private async getEventRegistrantMemberIds(eventId: number): Promise<number[]> {
    const rows = await this.eventRegistrationRepository.find({
      where: { eventId },
      select: ['memberId'],
    });
    return rows.map((row) => row.memberId);
  }

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
      status: 'active',
    });

    const saved = await this.userRepository.save(organizer);

    const organizerProfile = this.organizerProfileRepository.create({
      userId: saved.id,
      organizationName: (dto.full_name || '').trim() || '',
      organizationDescription: '',
      website: '',
      verificationStatus: 'unverified',
      freePublishUsed: false,
      paidPublishCredits: 0,
      createdAt: new Date(),
    });
    await this.organizerProfileRepository.save(organizerProfile);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safe } = saved;
    return safe;
  }

  async updateContact(
    userId: number,
    dto: { phone?: string; location?: string },
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId, roleId: 2 },
    });
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

  private async issueOrganizerToken(
    user: Pick<User, 'id' | 'roleId' | 'email' | 'status'>,
  ) {
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
      organizerStatus: organizerProfile?.verificationStatus ?? 'unverified',
      rejectionReason: organizerProfile?.rejectionReason ?? null,
      freePublishUsed: organizerProfile?.freePublishUsed ?? false,
      paidPublishCredits: organizerProfile?.paidPublishCredits ?? 0,
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
      const fbData = (await fbResponse.json()) as {
        email?: string;
        name?: string;
        error?: { message?: string };
      };
      if (!fbResponse.ok || fbData?.error) {
        throw new BadRequestException(
          fbData?.error?.message || 'Invalid Facebook token',
        );
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

    let user: {
      id: number;
      roleId: number;
      status: string;
      email: string;
    } | null = await this.userRepository.findOne({
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
        status: 'active',
      });
      const saved = await this.userRepository.save(created);
      await this.organizerProfileRepository.save(
        this.organizerProfileRepository.create({
          userId: saved.id,
          organizationName: '',
          organizationDescription: '',
          website: '',
          verificationStatus: 'unverified',
          freePublishUsed: false,
          paidPublishCredits: 0,
          createdAt: new Date(),
        }),
      );
      user = {
        id: saved.id,
        roleId: saved.roleId,
        status: saved.status,
        email: saved.email,
      };
    }

    if (user.roleId !== 2) {
      throw new UnauthorizedException(
        'This account is not registered as an organizer.',
      );
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
      verificationStatus: organizerProfile?.verificationStatus ?? 'unverified',
      rejectionReason: organizerProfile?.rejectionReason ?? null,
      freePublishUsed: organizerProfile?.freePublishUsed ?? false,
      paidPublishCredits: organizerProfile?.paidPublishCredits ?? 0,
      organizationName: organizerProfile?.organizationName ?? null,
      organizationDescription:
        organizerProfile?.organizationDescription ?? null,
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

    const eventsQb = this.eventRepository
      .createQueryBuilder('event')
      .select('event.id', 'id')
      .addSelect('event.title', 'title')
      .addSelect('event.description', 'description')
      .addSelect('event.status', 'status')
      .addSelect('event.start_datetime', 'startDatetime')
      .addSelect('event.end_datetime', 'endDatetime')
      .addSelect('event.location_name', 'locationName')
      .addSelect('event.capacity', 'capacity')
      .addSelect('event.total_price', 'totalPrice')
      .addSelect('event.is_physical', 'isPhysical')
      .addSelect('event.cover_image', 'coverImage')
      .where('event.organizer_id = :organizerId', { organizerId: userId })
      .orderBy('event.created_at', 'DESC');

    if (status) {
      eventsQb.andWhere('event.status = :status', { status });
    }

    const eventRows = await eventsQb.getRawMany<{
      id: number;
      title: string;
      description: string;
      status: string;
      startDatetime: Date | string;
      endDatetime: Date | string;
      locationName: string | null;
      capacity: number | string;
      totalPrice: number | string;
      isPhysical: number | boolean;
      coverImage: string | null;
    }>();

    const events = eventRows.map((row) => ({
      id: Number(row.id),
      title: row.title ?? '',
      description: row.description ?? '',
      status: row.status ?? 'draft',
      startDatetime: row.startDatetime ? new Date(row.startDatetime) : null,
      endDatetime: row.endDatetime ? new Date(row.endDatetime) : null,
      locationName: row.locationName ?? null,
      capacity: Number(row.capacity ?? 0),
      totalPrice: Number(row.totalPrice ?? 0),
      isPhysical: row.isPhysical === true || row.isPhysical === 1,
      coverImage: row.coverImage ?? null,
    }));

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

    const ratingAverage = ratingStats?.avg
      ? Number(Number(ratingStats.avg).toFixed(1))
      : null;
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
      .getRawMany<{
        memberId: number;
        fullName: string;
        profileImg: string | null;
      }>();

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
      organizationDescription:
        organizerProfile?.organizationDescription ?? null,
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

  /** Member-facing / shareable organizer summary (no private contact fields). */
  async getPublicOrganizerProfile(
    organizerId: number,
    viewer?: { userId: number; role: number },
  ) {
    const user = await this.userRepository.findOne({
      where: { id: organizerId },
    });

    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    const organizerProfile = await this.organizerProfileRepository.findOne({
      where: { userId: organizerId },
    });

    const publishedCount = await this.eventRepository.count({
      where: { organizerId, status: 'published' },
    });

    const followersCount = await this.organizerFollowRepository.count({
      where: { organizerId },
    });

    const ratingStats = await this.organizerReviewRepository
      .createQueryBuilder('rev')
      .select('AVG(rev.rating)', 'avg')
      .addSelect('COUNT(rev.id)', 'cnt')
      .where('rev.organizerId = :organizerId', { organizerId })
      .getRawOne<{ avg: string | null; cnt: string }>();

    const ratingAverage = ratingStats?.avg
      ? Number(Number(ratingStats.avg).toFixed(1))
      : null;
    const ratingCount = ratingStats ? Number(ratingStats.cnt) : 0;

    let isFollowing = false;
    if (viewer?.role === 1 && viewer.userId) {
      const row = await this.organizerFollowRepository.findOne({
        where: { organizerId, memberId: viewer.userId },
      });
      isFollowing = !!row;
    }

    const displayName =
      (organizerProfile?.organizationName || '').trim() ||
      user.fullName ||
      'Organizer';

    return {
      organizerId: user.id,
      fullName: user.fullName,
      displayName,
      location: user.location ?? null,
      profileImg: user.profileImg ?? null,
      organizationName: organizerProfile?.organizationName ?? null,
      organizationDescription:
        organizerProfile?.organizationDescription ?? null,
      website: organizerProfile?.website ?? null,
      verificationStatus: organizerProfile?.verificationStatus ?? 'pending',
      eventsCount: publishedCount,
      followersCount,
      ratingAverage,
      ratingCount,
      isFollowing,
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
      .getRawMany<{
        memberId: number;
        fullName: string;
        profileImg: string | null;
        followedAt: Date;
      }>();

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

  async getOrganizerAttendees(
    userId: number,
    options?: { page?: number; limit?: number; eventId?: number },
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(50, Math.max(1, options?.limit ?? 20));
    const offset = (page - 1) * limit;

    const qb = this.eventRegistrationRepository
      .createQueryBuilder('reg')
      .innerJoin(Event, 'event', 'event.id = reg.eventId')
      .innerJoin(User, 'member', 'member.id = reg.memberId')
      .where('event.organizerId = :organizerId', { organizerId: userId });

    if (options?.eventId) {
      qb.andWhere('event.id = :eventId', { eventId: options.eventId });
    }

    qb.select('reg.id', 'registrationId')
      .addSelect('reg.createdAt', 'joinedAt')
      .addSelect('member.id', 'memberId')
      .addSelect('member.full_name', 'fullName')
      .addSelect('member.profile_img', 'profileImg')
      .addSelect('member.email', 'email')
      .addSelect('member.phone', 'phone')
      .addSelect('event.id', 'eventId')
      .addSelect('event.title', 'eventTitle')
      .addSelect('event.status', 'eventStatus')
      .orderBy('reg.createdAt', 'DESC');

    const total = await qb.getCount();
    const rows = await qb.offset(offset).limit(limit).getRawMany<{
      registrationId: number | string;
      joinedAt: Date | string;
      memberId: number | string;
      fullName: string;
      profileImg: string | null;
      email: string | null;
      phone: string | null;
      eventId: number | string;
      eventTitle: string;
      eventStatus: string;
    }>();

    return {
      items: rows.map((row) => ({
        registrationId: Number(row.registrationId),
        memberId: Number(row.memberId),
        fullName: row.fullName ?? 'Member',
        profileImg: row.profileImg ?? null,
        email: row.email ?? null,
        phone: row.phone ?? null,
        eventId: Number(row.eventId),
        eventTitle: row.eventTitle ?? 'Untitled event',
        eventStatus: row.eventStatus ?? 'draft',
        joinedAt: row.joinedAt,
      })),
      page,
      limit,
      total,
      hasMore: offset + rows.length < total,
    };
  }

  async getOrganizerAnalytics(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    const events = await this.eventRepository.find({
      where: { organizerId: userId },
    });

    const now = Date.now();
    let drafts = 0;
    let publishedActive = 0;
    let past = 0;
    let upcoming = 0;

    events.forEach((event) => {
      if (event.status === 'draft') {
        drafts += 1;
        return;
      }
      if (event.status !== 'published') return;

      const startMs = event.startDatetime
        ? new Date(event.startDatetime).getTime()
        : null;
      const endMs = event.endDatetime
        ? new Date(event.endDatetime).getTime()
        : null;

      const isPast =
        (endMs != null && now > endMs) ||
        (endMs == null && startMs != null && now > startMs + 86400000);

      if (isPast) {
        past += 1;
        return;
      }

      publishedActive += 1;
      if (startMs != null && startMs > now) {
        upcoming += 1;
      }
    });

    const dashboard = await this.getProfileDashboard(userId);

    const topEventRows = await this.eventRegistrationRepository
      .createQueryBuilder('reg')
      .innerJoin(Event, 'event', 'event.id = reg.eventId')
      .where('event.organizerId = :organizerId', { organizerId: userId })
      .select('event.id', 'eventId')
      .addSelect('event.title', 'title')
      .addSelect('event.status', 'status')
      .addSelect('COUNT(reg.id)', 'registrationCount')
      .groupBy('event.id')
      .addGroupBy('event.title')
      .addGroupBy('event.status')
      .orderBy('registrationCount', 'DESC')
      .limit(5)
      .getRawMany<{
        eventId: number | string;
        title: string;
        status: string;
        registrationCount: string;
      }>();

    return {
      eventsTotal: events.length,
      drafts,
      publishedActive,
      past,
      upcoming,
      totalAttendees: dashboard.attendeesTotal,
      followersCount: dashboard.followersCount,
      ratingAverage: dashboard.ratingAverage,
      ratingCount: dashboard.ratingCount,
      topEventsByAttendees: topEventRows.map((row) => ({
        eventId: Number(row.eventId),
        title: row.title ?? 'Untitled event',
        status: row.status ?? 'draft',
        registrationCount: Number(row.registrationCount ?? 0),
      })),
    };
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

  async getPublishEligibility(userId: number) {
    const profile = await this.organizerProfileRepository.findOne({
      where: { userId },
    });
    const pendingCreditRequest = await this.creditRequestRepository.findOne({
      where: { organizerId: userId, status: 'pending' },
      order: { id: 'DESC' },
    });
    return computePublishEligibility(profile, !!pendingCreditRequest);
  }

  async requestPublishCredits(
    userId: number,
    dto: CreateOrganizerCreditRequestDto,
  ) {
    const profile = await this.organizerProfileRepository.findOne({
      where: { userId },
    });
    if (!profile || profile.verificationStatus !== 'approved') {
      throw new BadRequestException(
        'Verify your organizer account before requesting publish credits.',
      );
    }

    const existingPending = await this.creditRequestRepository.findOne({
      where: { organizerId: userId, status: 'pending' },
    });
    if (existingPending) {
      return {
        id: existingPending.id,
        status: existingPending.status,
        alreadyPending: true,
        message: 'You already have a credit request awaiting admin review.',
      };
    }

    const request = this.creditRequestRepository.create({
      organizerId: userId,
      eventId: dto.eventId ?? null,
      eventTitle: dto.eventTitle?.trim() || null,
      status: 'pending',
      creditsGranted: 0,
    });

    const saved = await this.creditRequestRepository.save(request);
    return {
      id: saved.id,
      status: saved.status,
      alreadyPending: false,
      message: 'Credit request submitted. An admin will review it shortly.',
    };
  }

  getPaymentConfig() {
    return {
      paymentPhone:
        this.configService.get<string>('ORGANIZER_PAYMENT_PHONE')?.trim() || '',
      single: {
        priceUsd: Number(this.configService.get('PUBLISH_PRICE_SINGLE') ?? 5),
        credits: 1,
      },
      bundle: {
        priceUsd: Number(this.configService.get('PUBLISH_PRICE_BUNDLE') ?? 20),
        credits: Number(this.configService.get('PUBLISH_BUNDLE_CREDITS') ?? 5),
      },
    };
  }

  async createPaymentRequest(
    userId: number,
    dto: CreateOrganizerPaymentRequestDto,
  ) {
    const profile = await this.organizerProfileRepository.findOne({
      where: { userId },
    });
    if (!profile || profile.verificationStatus !== 'approved') {
      throw new BadRequestException(
        'Verify your organizer account before purchasing publish credits.',
      );
    }

    const existingPending = await this.paymentRequestRepository.findOne({
      where: { organizerId: userId, status: 'pending' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'You already have a payment request awaiting approval.',
      );
    }

    const config = this.getPaymentConfig();
    const planConfig = dto.plan === 'bundle' ? config.bundle : config.single;

    const request = this.paymentRequestRepository.create({
      organizerId: userId,
      plan: dto.plan,
      amountUsd: String(planConfig.priceUsd),
      paymentReference: dto.paymentReference?.trim() || null,
      note: dto.note?.trim() || null,
      status: 'pending',
      creditsGranted: 0,
      adminNote: null,
    });

    const saved = await this.paymentRequestRepository.save(request);
    return {
      id: saved.id,
      plan: saved.plan,
      amountUsd: Number(saved.amountUsd),
      status: saved.status,
      message: 'Payment request submitted. We will review it shortly.',
    };
  }

  async getMyPaymentRequests(userId: number) {
    const rows = await this.paymentRequestRepository.find({
      where: { organizerId: userId },
      order: { id: 'DESC' },
      take: 10,
    });
    return rows.map((row) => ({
      id: row.id,
      plan: row.plan,
      amountUsd: Number(row.amountUsd),
      paymentReference: row.paymentReference,
      note: row.note,
      status: row.status,
      creditsGranted: row.creditsGranted,
      adminNote: row.adminNote,
      createdAt: row.createdAt,
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

  async messageEventAttendees(
    organizerId: number,
    eventId: number,
    title: string,
    body: string,
  ) {
    const event = await this.assertOrganizerOwnsEvent(organizerId, eventId);
    const memberIds = await this.getEventRegistrantMemberIds(eventId);

    await Promise.all(
      memberIds.map((memberId) =>
        this.notificationsService.notifyOrganizerBlast(
          memberId,
          eventId,
          title.trim(),
          body.trim(),
        ),
      ),
    );

    return { success: true, notifiedCount: memberIds.length, eventTitle: event.title };
  }

  async checkInEventAttendee(
    organizerId: number,
    eventId: number,
    memberId: number,
  ) {
    await this.assertOrganizerOwnsEvent(organizerId, eventId);

    const registration = await this.eventRegistrationRepository.findOne({
      where: { eventId, memberId },
    });

    if (!registration) {
      throw new BadRequestException('This ticket is not registered for this event');
    }

    if (registration.status === 'checked_in') {
      const member = await this.userRepository.findOne({ where: { id: memberId } });
      return {
        success: true,
        alreadyCheckedIn: true,
        memberName: member?.fullName ?? 'Member',
      };
    }

    registration.status = 'checked_in';
    await this.eventRegistrationRepository.save(registration);

    const member = await this.userRepository.findOne({ where: { id: memberId } });
    return {
      success: true,
      alreadyCheckedIn: false,
      memberName: member?.fullName ?? 'Member',
    };
  }

  async cancelEventAndNotify(organizerId: number, eventId: number) {
    const event = await this.assertOrganizerOwnsEvent(organizerId, eventId);
    event.status = 'cancelled';
    await this.eventRepository.save(event);

    const memberIds = await this.getEventRegistrantMemberIds(eventId);
    await Promise.all(
      memberIds.map((memberId) =>
        this.notificationsService.notifyEventCancelled(
          memberId,
          eventId,
          event.title,
        ),
      ),
    );

    return { success: true, notifiedCount: memberIds.length };
  }

  async notifyEventPostponed(
    organizerId: number,
    eventId: number,
    body: string,
  ) {
    const event = await this.assertOrganizerOwnsEvent(organizerId, eventId);
    const message =
      body.trim() ||
      'The schedule changed. Open the event page for the latest date and time.';

    const memberIds = await this.getEventRegistrantMemberIds(eventId);
    await Promise.all(
      memberIds.map((memberId) =>
        this.notificationsService.notifyEventPostponed(
          memberId,
          eventId,
          event.title,
          message,
        ),
      ),
    );

    return { success: true, notifiedCount: memberIds.length };
  }
}
