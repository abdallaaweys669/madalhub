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
import { toPublicUploadPath } from 'src/common/uploads-path';
import { NotificationsService } from 'src/notifications/notifications.service';
import { OrganizerNotificationsService } from 'src/notifications/organizer-notifications.service';
import {
  hasOnlinePresenceProof,
  resolveVerificationProofType,
} from '../helpers/verification-proof.helper';
import { formatPhoneE164, normalizePhoneDigits } from 'src/common/phone.util';

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
    @InjectRepository(OrganizerReview)
    private organizerReviewRepository: Repository<OrganizerReview>,
    @InjectRepository(OrganizerPaymentRequest)
    private paymentRequestRepository: Repository<OrganizerPaymentRequest>,
    @InjectRepository(OrganizerCreditRequest)
    private creditRequestRepository: Repository<OrganizerCreditRequest>,
    private configService: ConfigService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private organizerNotificationsService: OrganizerNotificationsService,
  ) {}

  private async getPublishedOrganizerMetrics(organizerId: number) {
    const publishedEvents = await this.eventRepository.find({
      where: { organizerId, status: 'published' },
      select: ['id', 'startDatetime', 'endDatetime'],
    });

    const now = Date.now();
    const eventIds = publishedEvents.map((event) => event.id);
    let attendeesTotal = 0;

    if (eventIds.length > 0) {
      const attendeeRow = await this.eventRegistrationRepository
        .createQueryBuilder('reg')
        .select('COUNT(reg.id)', 'cnt')
        .where('reg.eventId IN (:...eventIds)', { eventIds })
        .andWhere("reg.status != 'cancelled'")
        .getRawOne<{ cnt: string }>();
      attendeesTotal = attendeeRow ? Number(attendeeRow.cnt) : 0;
    }

    let upcomingEventsCount = 0;
    for (const event of publishedEvents) {
      const startMs = event.startDatetime
        ? new Date(event.startDatetime).getTime()
        : null;
      const endMs = event.endDatetime
        ? new Date(event.endDatetime).getTime()
        : null;
      const isPast =
        (endMs != null && now > endMs) ||
        (endMs == null && startMs != null && now > startMs + 86400000);
      if (!isPast && startMs != null && startMs > now) {
        upcomingEventsCount += 1;
      }
    }

    return {
      eventsCount: publishedEvents.length,
      attendeesTotal,
      upcomingEventsCount,
    };
  }

  private countUpcomingPublishedEvents(
    events: Pick<Event, 'status' | 'startDatetime' | 'endDatetime'>[],
  ) {
    const now = Date.now();
    let upcomingEventsCount = 0;

    for (const event of events) {
      if (event.status !== 'published') continue;
      const startMs = event.startDatetime
        ? new Date(event.startDatetime).getTime()
        : null;
      const endMs = event.endDatetime
        ? new Date(event.endDatetime).getTime()
        : null;
      const isPast =
        (endMs != null && now > endMs) ||
        (endMs == null && startMs != null && now > startMs + 86400000);
      if (!isPast && startMs != null && startMs > now) {
        upcomingEventsCount += 1;
      }
    }

    return upcomingEventsCount;
  }

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

  private async assertOrganizerPhoneUnique(
    phone: string,
    excludeUserId: number,
  ): Promise<void> {
    const normalized = normalizePhoneDigits(phone);
    if (!normalized) {
      return;
    }

    const profiles = await this.organizerProfileRepository.find({
      select: ['userId', 'phone'],
    });

    const taken = profiles.some(
      (row) =>
        row.userId !== excludeUserId &&
        row.phone &&
        normalizePhoneDigits(row.phone) === normalized,
    );

    if (taken) {
      throw new BadRequestException(
        'This phone number is already registered to another organizer.',
      );
    }
  }

  async isOrganizerPhoneAvailable(phone: string, userId: number): Promise<boolean> {
    const normalized = normalizePhoneDigits(phone);
    if (normalized.length < 6) {
      return false;
    }

    try {
      await this.assertOrganizerPhoneUnique(phone, userId);
      return true;
    } catch (err) {
      if (err instanceof BadRequestException) {
        return false;
      }
      throw err;
    }
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

    if (dto.phone !== undefined) {
      const phoneE164 = formatPhoneE164(dto.phone);
      if (phoneE164) {
        await this.assertOrganizerPhoneUnique(phoneE164, userId);
        user.phone = phoneE164;

        const profile = await this.organizerProfileRepository.findOne({ where: { userId } });
        if (profile) {
          profile.phone = phoneE164;
          await this.organizerProfileRepository.save(profile);
        }
      } else {
        user.phone = '';
      }
    }
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch || user.roleId !== 2) {
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
      throw new UnauthorizedException('Sign in failed');
    }

    return this.issueOrganizerToken(user);
  }

  async getStatus(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'roleId', 'status', 'email', 'fullName', 'location', 'profileImg'],
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
      organizationDescription: organizerProfile?.organizationDescription ?? null,
      organizerTypeId: organizerProfile?.organizerTypeId ?? null,
      organizerTypeOther: organizerProfile?.organizerTypeOther ?? null,
      phone: organizerProfile?.phone ?? null,
      website: organizerProfile?.website ?? null,
      facebook: organizerProfile?.facebook ?? null,
      instagram: organizerProfile?.instagram ?? null,
      location: user.location ?? null,
      profileImg: user.profileImg ?? null,
      hasDocument: !!document,
      documentStatus: document?.status ?? null,
      documentTypeSlug: document?.documentTypeSlug ?? null,
    };
  }

  async getOrganizerTypes() {
    const rows = await this.organizerProfileRepository.query(
      `SELECT id, slug, name, icon, sort_order FROM organizer_types WHERE is_active = 1 ORDER BY sort_order ASC`,
    );
    return { types: rows };
  }

  async getVerificationDocumentTypes() {
    const rows = await this.organizerProfileRepository.query(
      `SELECT id, slug, name, icon, sort_order FROM organizer_verification_document_types WHERE is_active = 1 ORDER BY sort_order ASC`,
    );
    return { types: rows };
  }

  async submitVerification(
    userId: number,
    data: {
      organizationName: string;
      organizerTypeId?: number | null;
      organizerTypeOther?: string | null;
      phone?: string | null;
      website?: string | null;
      facebook?: string | null;
      instagram?: string | null;
      documentTypeSlug?: string | null;
      documentPath?: string | null;
      keepExistingDocument?: boolean;
      location?: string | null;
      profileImagePath?: string | null;
    },
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    let profile = await this.organizerProfileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Organizer profile not found');
    }

    if (!['unverified', 'rejected'].includes(profile.verificationStatus)) {
      throw new BadRequestException(
        'Verification can only be submitted from unverified or rejected status.',
      );
    }

    const phone = formatPhoneE164(data.phone?.trim() || '');
    if (!phone) {
      throw new BadRequestException('Phone number is required.');
    }

    await this.assertOrganizerPhoneUnique(phone, userId);

    const location = data.location?.trim() || '';
    if (!location) {
      throw new BadRequestException('Location is required.');
    }

    // Update profile fields
    const orgName =
      data.organizationName.trim() || profile.organizationName?.trim() || '';
    profile.organizationName = orgName;
    const existingDesc = profile.organizationDescription?.trim();
    profile.organizationDescription = existingDesc || orgName;
    if (data.organizerTypeId != null) profile.organizerTypeId = data.organizerTypeId;
    if (data.organizerTypeOther != null) {
      profile.organizerTypeOther = data.organizerTypeOther.trim() || null;
    }
    if (data.phone != null) profile.phone = phone;
    if (data.website != null) profile.website = data.website.trim() || null;
    if (data.facebook != null) profile.facebook = data.facebook.trim() || null;
    if (data.instagram != null) profile.instagram = data.instagram.trim() || null;

    const hasDocumentProof = Boolean(
      (data.documentPath && data.documentTypeSlug) ||
        (data.keepExistingDocument && data.documentTypeSlug),
    );
    const hasOnlineProof = hasOnlinePresenceProof(profile);
    if (!hasDocumentProof && !hasOnlineProof) {
      throw new BadRequestException(
        'Add at least one social media link or website so we can verify you online.',
      );
    }

    profile.verificationStatus = 'pending';
    profile.rejectionReason = null;
    await this.organizerProfileRepository.save(profile);

    user.location = location;
    user.phone = phone;
    if (data.profileImagePath) {
      user.profileImg = `/uploads/${data.profileImagePath}`;
    }
    await this.userRepository.save(user);

    // Handle document — new upload or keep existing on resubmit
    if (data.documentPath && data.documentTypeSlug) {
      const publicDocumentPath = toPublicUploadPath(data.documentPath);
      const typeRows: Array<{ slug: string }> = await this.organizerProfileRepository.query(
        `SELECT slug FROM organizer_verification_document_types
         WHERE is_active = 1 AND slug = ?
         LIMIT 1`,
        [data.documentTypeSlug],
      );
      if (!typeRows.length) {
        throw new BadRequestException('Invalid document type selected.');
      }

      const existing = await this.organizerDocumentRepository.findOne({
        where: { organizerId: userId },
        order: { id: 'ASC' },
      });

      if (existing) {
        existing.documentType = data.documentTypeSlug;
        existing.documentTypeSlug = data.documentTypeSlug;
        existing.documentPath = publicDocumentPath!;
        existing.status = 'pending';
        existing.uploadedAt = new Date();
        await this.organizerDocumentRepository.save(existing);
      } else {
        const doc = this.organizerDocumentRepository.create({
          organizerId: userId,
          documentType: data.documentTypeSlug,
          documentTypeSlug: data.documentTypeSlug,
          documentPath: publicDocumentPath!,
          status: 'pending',
          uploadedAt: new Date(),
        });
        await this.organizerDocumentRepository.save(doc);
      }
    } else if (data.keepExistingDocument && data.documentTypeSlug) {
      const typeRows: Array<{ slug: string }> = await this.organizerProfileRepository.query(
        `SELECT slug FROM organizer_verification_document_types
         WHERE is_active = 1 AND slug = ?
         LIMIT 1`,
        [data.documentTypeSlug],
      );
      if (!typeRows.length) {
        throw new BadRequestException('Invalid document type selected.');
      }

      const existing = await this.organizerDocumentRepository.findOne({
        where: { organizerId: userId },
        order: { id: 'DESC' },
      });

      if (existing?.documentPath) {
        existing.documentType = data.documentTypeSlug;
        existing.documentTypeSlug = data.documentTypeSlug;
        existing.status = 'pending';
        existing.uploadedAt = new Date();
        await this.organizerDocumentRepository.save(existing);
      } else {
        throw new BadRequestException(
          'No existing document found. Please upload a verification document.',
        );
      }
    }

    void this.organizerNotificationsService
      .clearVerificationRejectedNotifications(userId)
      .catch(() => undefined);

    return {
      verificationStatus: 'pending',
      message: 'Verification submitted successfully.',
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

    const upcomingEventsCount = this.countUpcomingPublishedEvents(events);

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
      upcomingEventsCount,
    };
  }

  /** Member-facing / shareable organizer summary (no private contact fields). */
  async getPublicOrganizerProfile(
    organizerId: number,
    _viewer?: { userId: number; role: number },
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

    const metrics = await this.getPublishedOrganizerMetrics(organizerId);

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
      eventsCount: metrics.eventsCount,
      attendeesTotal: metrics.attendeesTotal,
      upcomingEventsCount: metrics.upcomingEventsCount,
    };
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
      topEventsByAttendees: topEventRows.map((row) => ({
        eventId: Number(row.eventId),
        title: row.title ?? 'Untitled event',
        status: row.status ?? 'draft',
        registrationCount: Number(row.registrationCount ?? 0),
      })),
    };
  }

  private classifyOrganizerEventBucket(
    event: Pick<Event, 'status' | 'startDatetime' | 'endDatetime'>,
    nowMs: number,
  ): string {
    if (event.status === 'draft') return 'draft';
    if (event.status !== 'published') return event.status;

    const startMs = event.startDatetime
      ? new Date(event.startDatetime).getTime()
      : null;
    const endMs = event.endDatetime
      ? new Date(event.endDatetime).getTime()
      : null;

    const isPast =
      (endMs != null && nowMs > endMs) ||
      (endMs == null && startMs != null && nowMs > startMs + 86400000);

    if (isPast) return 'past';
    if (startMs != null && startMs > nowMs) return 'upcoming';
    return 'live';
  }

  async getOrganizerReport(userId: number, type: string) {
    const normalized = String(type || '').trim().toLowerCase();
    const allowed = new Set([
      'overview',
      'events',
      'registrations',
      'attendance',
      'top-events',
    ]);
    if (!allowed.has(normalized)) {
      throw new BadRequestException(
        'Invalid report type. Use overview, events, registrations, attendance, or top-events.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Organizer not found');
    }

    const generatedAt = new Date().toISOString();
    const nowMs = Date.now();

    if (normalized === 'overview') {
      const analytics = await this.getOrganizerAnalytics(userId);
      const summary = {
        eventsTotal: analytics.eventsTotal,
        drafts: analytics.drafts,
        upcoming: analytics.upcoming,
        publishedActive: analytics.publishedActive,
        past: analytics.past,
        totalAttendees: analytics.totalAttendees,
      };
      return {
        type: normalized,
        title: 'Overview',
        generatedAt,
        summary,
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' },
        ],
        rows: [
          { metric: 'Total events', value: analytics.eventsTotal },
          { metric: 'Drafts', value: analytics.drafts },
          { metric: 'Upcoming', value: analytics.upcoming },
          { metric: 'Live / active', value: analytics.publishedActive },
          { metric: 'Past events', value: analytics.past },
          { metric: 'Total attendees', value: analytics.totalAttendees },
        ],
      };
    }

    if (normalized === 'events') {
      const events = await this.eventRepository.find({
        where: { organizerId: userId },
        order: { createdAt: 'DESC' },
      });

      const registrationCountByEventId = new Map<number, number>();
      if (events.length > 0) {
        const ids = events.map((e) => e.id);
        const regRows = await this.eventRegistrationRepository
          .createQueryBuilder('reg')
          .select('reg.eventId', 'eventId')
          .addSelect('COUNT(reg.id)', 'cnt')
          .where('reg.eventId IN (:...ids)', { ids })
          .andWhere("reg.status != 'cancelled'")
          .groupBy('reg.eventId')
          .getRawMany<{ eventId: number; cnt: string }>();
        for (const row of regRows) {
          registrationCountByEventId.set(Number(row.eventId), Number(row.cnt));
        }
      }

      const rows = events.map((event) => {
        const bucket = this.classifyOrganizerEventBucket(event, nowMs);
        const capacity = Number(event.capacity ?? 0);
        const price = Number(event.totalPrice ?? 0);
        return {
          eventId: event.id,
          title: event.title ?? 'Untitled event',
          status: event.status,
          bucket,
          startDate: event.startDatetime
            ? new Date(event.startDatetime).toISOString()
            : null,
          endDate: event.endDatetime
            ? new Date(event.endDatetime).toISOString()
            : null,
          location: event.locationName ?? (event.isPhysical ? 'In-person' : 'Online'),
          registrations: registrationCountByEventId.get(event.id) ?? 0,
          capacity: capacity > 0 ? capacity : 'Unlimited',
          price: price > 0 ? price : 'Free',
        };
      });

      return {
        type: normalized,
        title: 'Events',
        generatedAt,
        summary: {
          total: rows.length,
          drafts: rows.filter((r) => r.bucket === 'draft').length,
          upcoming: rows.filter((r) => r.bucket === 'upcoming').length,
          live: rows.filter((r) => r.bucket === 'live').length,
          past: rows.filter((r) => r.bucket === 'past').length,
        },
        columns: [
          { key: 'title', label: 'Event' },
          { key: 'status', label: 'Status' },
          { key: 'bucket', label: 'Schedule' },
          { key: 'startDate', label: 'Start' },
          { key: 'endDate', label: 'End' },
          { key: 'location', label: 'Location' },
          { key: 'registrations', label: 'Registrations' },
          { key: 'capacity', label: 'Capacity' },
          { key: 'price', label: 'Price' },
        ],
        rows,
      };
    }

    if (normalized === 'registrations') {
      const regRows = await this.eventRegistrationRepository
        .createQueryBuilder('reg')
        .innerJoin(Event, 'event', 'event.id = reg.eventId')
        .innerJoin(User, 'member', 'member.id = reg.memberId')
        .where('event.organizerId = :organizerId', { organizerId: userId })
        .andWhere("reg.status != 'cancelled'")
        .select('reg.id', 'registrationId')
        .addSelect('reg.status', 'status')
        .addSelect('reg.createdAt', 'joinedAt')
        .addSelect('member.full_name', 'fullName')
        .addSelect('member.email', 'email')
        .addSelect('member.phone', 'phone')
        .addSelect('event.id', 'eventId')
        .addSelect('event.title', 'eventTitle')
        .orderBy('reg.createdAt', 'DESC')
        .getRawMany<{
          registrationId: number | string;
          status: string;
          joinedAt: Date | string;
          fullName: string;
          email: string | null;
          phone: string | null;
          eventId: number | string;
          eventTitle: string;
        }>();

      const rows = regRows.map((row) => ({
        registrationId: Number(row.registrationId),
        eventId: Number(row.eventId),
        eventTitle: row.eventTitle ?? 'Untitled event',
        memberName: row.fullName ?? 'Member',
        email: row.email ?? '',
        phone: row.phone ?? '',
        joinedAt: row.joinedAt ? new Date(row.joinedAt).toISOString() : null,
        status: row.status,
      }));

      return {
        type: normalized,
        title: 'Registrations',
        generatedAt,
        summary: {
          total: rows.length,
          events: new Set(rows.map((r) => r.eventId)).size,
        },
        columns: [
          { key: 'eventTitle', label: 'Event' },
          { key: 'memberName', label: 'Member' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'joinedAt', label: 'Joined at' },
          { key: 'status', label: 'Status' },
        ],
        rows,
      };
    }

    if (normalized === 'attendance') {
      const statsRows = await this.eventRegistrationRepository
        .createQueryBuilder('reg')
        .innerJoin(Event, 'event', 'event.id = reg.eventId')
        .where('event.organizerId = :organizerId', { organizerId: userId })
        .andWhere("reg.status != 'cancelled'")
        .select('event.id', 'eventId')
        .addSelect('event.title', 'eventTitle')
        .addSelect('event.status', 'eventStatus')
        .addSelect('COUNT(reg.id)', 'registered')
        .addSelect(
          "SUM(CASE WHEN reg.status IN ('checked_in', 'attended') THEN 1 ELSE 0 END)",
          'checkedIn',
        )
        .groupBy('event.id')
        .addGroupBy('event.title')
        .addGroupBy('event.status')
        .orderBy('registered', 'DESC')
        .getRawMany<{
          eventId: number | string;
          eventTitle: string;
          eventStatus: string;
          registered: string;
          checkedIn: string;
        }>();

      const rows = statsRows.map((row) => {
        const registered = Number(row.registered ?? 0);
        const checkedIn = Number(row.checkedIn ?? 0);
        const rate =
          registered > 0 ? `${Math.round((checkedIn / registered) * 100)}%` : '0%';
        return {
          eventId: Number(row.eventId),
          eventTitle: row.eventTitle ?? 'Untitled event',
          eventStatus: row.eventStatus ?? 'draft',
          registered,
          checkedIn,
          attendanceRate: rate,
        };
      });

      const totalRegistered = rows.reduce((sum, r) => sum + r.registered, 0);
      const totalCheckedIn = rows.reduce((sum, r) => sum + r.checkedIn, 0);

      return {
        type: normalized,
        title: 'Attendance',
        generatedAt,
        summary: {
          events: rows.length,
          registered: totalRegistered,
          checkedIn: totalCheckedIn,
          overallRate:
            totalRegistered > 0
              ? `${Math.round((totalCheckedIn / totalRegistered) * 100)}%`
              : '0%',
        },
        columns: [
          { key: 'eventTitle', label: 'Event' },
          { key: 'eventStatus', label: 'Status' },
          { key: 'registered', label: 'Registered' },
          { key: 'checkedIn', label: 'Checked in' },
          { key: 'attendanceRate', label: 'Attendance rate' },
        ],
        rows,
      };
    }

    const topRows = await this.eventRegistrationRepository
      .createQueryBuilder('reg')
      .innerJoin(Event, 'event', 'event.id = reg.eventId')
      .where('event.organizerId = :organizerId', { organizerId: userId })
      .andWhere("reg.status != 'cancelled'")
      .select('event.id', 'eventId')
      .addSelect('event.title', 'title')
      .addSelect('event.status', 'status')
      .addSelect('event.start_datetime', 'startDatetime')
      .addSelect('COUNT(reg.id)', 'registrationCount')
      .groupBy('event.id')
      .addGroupBy('event.title')
      .addGroupBy('event.status')
      .addGroupBy('event.start_datetime')
      .orderBy('registrationCount', 'DESC')
      .limit(25)
      .getRawMany<{
        eventId: number | string;
        title: string;
        status: string;
        startDatetime: Date | string | null;
        registrationCount: string;
      }>();

    const rows = topRows.map((row, index) => ({
      rank: index + 1,
      eventId: Number(row.eventId),
      title: row.title ?? 'Untitled event',
      status: row.status ?? 'draft',
      registrations: Number(row.registrationCount ?? 0),
      startDate: row.startDatetime
        ? new Date(row.startDatetime).toISOString()
        : null,
    }));

    return {
      type: normalized,
      title: 'Top events',
      generatedAt,
      summary: {
        listed: rows.length,
        topRegistrations: rows[0]?.registrations ?? 0,
      },
      columns: [
        { key: 'rank', label: 'Rank' },
        { key: 'title', label: 'Event' },
        { key: 'status', label: 'Status' },
        { key: 'registrations', label: 'Registrations' },
        { key: 'startDate', label: 'Start' },
      ],
      rows,
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

    if (registration.status === 'cancelled') {
      throw new BadRequestException('This registration was cancelled');
    }

    if (
      registration.status === 'checked_in' ||
      registration.status === 'attended'
    ) {
      const member = await this.userRepository.findOne({ where: { id: memberId } });
      return {
        success: true,
        alreadyCheckedIn: true,
        memberName: member?.fullName ?? 'Member',
      };
    }

    registration.status = 'attended';
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
