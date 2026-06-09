import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CreateEventDto } from '../DTO/create-event.dto';
import { GetEventsQueryDto } from '../DTO/get-events-query.dto';
import { UpdateEventDto } from '../DTO/update-event.dto';
import { Event } from 'src/database/entities/event.entity';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { EventSponsor } from 'src/database/entities/event-sponsor.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { Interest } from 'src/database/entities/interest.entity';
import { SavedEvent } from 'src/database/entities/saved-event.entity';
import { EventProgramRoster } from 'src/database/entities/event-program-roster.entity';
import { EventCohost } from 'src/database/entities/event-cohost.entity';
import { EventLike } from 'src/database/entities/event-like.entity';
import { MemberInterest } from 'src/database/entities/member-interest.entity';
import { MemberEventInteraction } from 'src/database/entities/member-event-interaction.entity';
import type { MemberEventInteractionAction } from 'src/database/entities/member-event-interaction.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

const ROLE_ORGANIZER = 2;
const ROLE_ADMIN = 3;

const BROWSING_TASTE_WEIGHTS: Record<'viewed' | 'opened' | 'shared', number> = {
  viewed: 0.5,
  opened: 1,
  shared: 2,
};

function canViewerSeeHiddenProfile(viewer?: { userId?: number; role?: number } | null): boolean {
  const role = viewer?.role != null ? Number(viewer.role) : null;
  return role === ROLE_ORGANIZER || role === ROLE_ADMIN;
}

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepo: Repository<OrganizerProfile>,
    @InjectRepository(EventSponsor)
    private eventSponsorRepo: Repository<EventSponsor>,
    @InjectRepository(EventRegistration)
    private eventRegistrationRepo: Repository<EventRegistration>,
    @InjectRepository(Interest)
    private interestRepo: Repository<Interest>,
    @InjectRepository(SavedEvent)
    private savedEventRepo: Repository<SavedEvent>,
    @InjectRepository(EventProgramRoster)
    private eventProgramRosterRepo: Repository<EventProgramRoster>,
    @InjectRepository(EventCohost)
    private eventCohostRepo: Repository<EventCohost>,
    @InjectRepository(EventLike)
    private eventLikeRepo: Repository<EventLike>,
    @InjectRepository(MemberInterest)
    private memberInterestRepo: Repository<MemberInterest>,
    @InjectRepository(MemberEventInteraction)
    private memberEventInteractionRepo: Repository<MemberEventInteraction>,
  ) {}

  private ensureMember(user: User) {
    if (user.roleId !== 1) {
      throw new ForbiddenException('Only members can perform this action');
    }
  }

  private mapEventSummary(
    event: Event,
    attendeesCount: number,
    joined: boolean,
    isSaved: boolean,
    attendeePreviews?: {
      userId: number | null;
      avatar: string | null;
      name: string;
      isAnonymous?: boolean;
    }[],
    likeCount = 0,
    isLiked = false,
  ) {
    return {
      id: event.id,
      interestId: event.interestId,
      title: event.title,
      description: event.description,
      image: event.coverImage ?? null,
      startsAt: event.startDatetime,
      endsAt: event.endDatetime,
      city: event.locationName ?? null,
      locationName: event.locationName ?? null,
      locationAddress: event.locationAddress ?? null,
      isOnline: !event.isPhysical,
      priceType: event.totalPrice > 0 ? 'Paid' : 'Free',
      priceAmount: event.totalPrice > 0 ? event.totalPrice : null,
      capacity: event.capacity,
      goingCount: attendeesCount,
      isJoined: joined,
      datetime: {
        start: event.startDatetime,
        end: event.endDatetime,
      },
      location: {
        name: event.locationName ?? null,
        address: event.locationAddress ?? null,
        latitude: event.locationLatitude ?? null,
        longitude: event.locationLongitude ?? null,
      },
      locationLatitude: event.locationLatitude ?? null,
      locationLongitude: event.locationLongitude ?? null,
      price: event.totalPrice,
      attendeesCount,
      joined,
      isSaved,
      attendeePreviews: attendeePreviews ?? [],
      eventFormat: event.eventFormat ?? null,
      likeCount,
      isLiked,
      createdAt: event.createdAt,
    };
  }

  private async buildAttendeePreviewMap(
    eventIds: number[],
    previewLimit = 3,
    viewer?: { userId?: number; role?: number } | null,
  ): Promise<
    Map<
      number,
      {
        userId: number | null;
        avatar: string | null;
        name: string;
        isAnonymous?: boolean;
      }[]
    >
  > {
    const attendeePreviewMap = new Map<
      number,
      {
        userId: number | null;
        avatar: string | null;
        name: string;
        isAnonymous?: boolean;
      }[]
    >();
    if (!eventIds.length) {
      return attendeePreviewMap;
    }

    const viewerId = viewer?.userId != null ? Number(viewer.userId) : null;
    const canRevealHidden = canViewerSeeHiddenProfile(viewer);

    const previewRows = await this.eventRegistrationRepo.manager
      .createQueryBuilder()
      .select('reg.event_id', 'eventId')
      .addSelect('reg.member_id', 'userId')
      .addSelect('user.profile_img', 'profileImg')
      .addSelect('user.full_name', 'fullName')
      .addSelect('user.profile_hidden', 'profileHidden')
      .addSelect('reg.id', 'registrationId')
      .from('event_registrations', 'reg')
      .innerJoin('users', 'user', 'user.id = reg.member_id')
      .where('reg.event_id IN (:...eventIds)', { eventIds })
      .orderBy('reg.event_id', 'ASC')
      .addOrderBy('reg.id', 'ASC')
      .getRawMany<Record<string, unknown>>();

    const pickRaw = (row: Record<string, unknown>, keys: string[]) => {
      const lowered = Object.keys(row).reduce<Record<string, unknown>>(
        (acc, key) => {
          acc[key.toLowerCase()] = row[key];
          return acc;
        },
        {},
      );
      for (const key of keys) {
        const v = lowered[key.toLowerCase()];
        if (v !== undefined && v !== null && v !== '') return v;
      }
      return undefined;
    };

    const seenPerEvent = new Map<number, Set<number>>();
    for (const row of previewRows) {
      const eventId = Number(pickRaw(row, ['eventId', 'event_id']));
      const uid = Number(pickRaw(row, ['userId', 'member_id', 'memberId']));
      if (!Number.isFinite(eventId) || !Number.isFinite(uid)) {
        continue;
      }

      let seen = seenPerEvent.get(eventId);
      if (!seen) {
        seen = new Set<number>();
        seenPerEvent.set(eventId, seen);
      }
      if (seen.has(uid)) continue;
      seen.add(uid);

      let list = attendeePreviewMap.get(eventId);
      if (!list) {
        list = [];
        attendeePreviewMap.set(eventId, list);
      }
      if (list.length >= previewLimit) continue;

      const profileImg = pickRaw(row, ['profileImg', 'profile_img']);
      const fullName = pickRaw(row, ['fullName', 'full_name']);
      const profileHidden = Boolean(pickRaw(row, ['profileHidden', 'profile_hidden']));
      const isSelf = viewerId != null && viewerId === uid;
      const shouldMask = profileHidden && !canRevealHidden && !isSelf;

      list.push({
        userId: shouldMask ? null : uid,
        avatar: shouldMask ? null : typeof profileImg === 'string' ? profileImg : null,
        name:
          shouldMask
            ? 'Anonymous'
            : typeof fullName === 'string' && fullName.trim()
              ? fullName.trim()
              : 'Member',
        isAnonymous: shouldMask ? true : undefined,
      });
    }

    return attendeePreviewMap;
  }

  private applyDateBucketFilter(
    qb,
    dateBucket?: GetEventsQueryDto['dateBucket'],
  ) {
    if (!dateBucket) {
      return;
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    if (dateBucket === 'upcoming') {
      qb.andWhere('event.startDatetime >= :now', { now });
      return;
    }

    if (dateBucket === 'today') {
      qb.andWhere('event.startDatetime BETWEEN :startOfToday AND :endOfToday', {
        startOfToday,
        endOfToday,
      });
      return;
    }

    if (dateBucket === 'tomorrow') {
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      const endOfTomorrow = new Date(startOfTomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);
      qb.andWhere(
        'event.startDatetime BETWEEN :startOfTomorrow AND :endOfTomorrow',
        {
          startOfTomorrow,
          endOfTomorrow,
        },
      );
      return;
    }

    if (dateBucket === 'this-weekend') {
      const start = new Date(startOfToday);
      const day = start.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7;
      start.setDate(start.getDate() + daysUntilSaturday);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('event.startDatetime BETWEEN :weekendStart AND :weekendEnd', {
        weekendStart: start,
        weekendEnd: end,
      });
      return;
    }

    if (dateBucket === 'next-week') {
      const start = new Date(startOfToday);
      const daysUntilNextMonday = (8 - start.getDay()) % 7 || 7;
      start.setDate(start.getDate() + daysUntilNextMonday);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      qb.andWhere(
        'event.startDatetime BETWEEN :nextWeekStart AND :nextWeekEnd',
        {
          nextWeekStart: start,
          nextWeekEnd: end,
        },
      );
    }
  }

  private ensureOrganizerActive(user: User) {
    if (user.roleId !== 2) {
      throw new ForbiddenException('Only organizers can perform this action');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('Organizer must be active');
    }
  }

  private async syncEventSponsors(
    eventId: number,
    sponsors: { name: string; logo?: string }[],
  ) {
    await this.eventSponsorRepo.delete({ eventId });
    const rows = sponsors
      .filter((s) => s?.name?.trim())
      .map((s) =>
        this.eventSponsorRepo.create({
          eventId,
          sponsorName: s.name.trim(),
          sponsorLogo: s.logo?.trim() ?? '',
        }),
      );
    if (rows.length > 0) {
      await this.eventSponsorRepo.save(rows);
    }
  }

  private async syncEventRoster(
    eventId: number,
    roster: {
      role: string;
      displayName: string;
      title?: string | null;
      sortOrder?: number;
      photoUrl?: string | null;
    }[],
  ) {
    await this.eventProgramRosterRepo.delete({ eventId });
    const rows = roster
      .filter((r) => r?.displayName?.trim() && r?.role?.trim())
      .map((r, idx) =>
        this.eventProgramRosterRepo.create({
          eventId,
          role: r.role.trim(),
          displayName: r.displayName.trim(),
          title: r.title?.trim() || null,
          photoUrl: r.photoUrl?.trim() || null,
          sortOrder: r.sortOrder ?? idx,
        }),
      );
    if (rows.length > 0) {
      await this.eventProgramRosterRepo.save(rows);
    }
  }

  private readonly descriptionMetaSeparator = '\n---\n[KULAN_EVENT_META]\n';
  private readonly descriptionMetaEnd = '\n[/KULAN_EVENT_META]';

  /** Parses embedded KULAN mobile meta (format + people_json) from description. */
  private parseDescriptionMeta(description: string): {
    format: string | null;
    people: { role: string; fullName: string }[];
  } {
    const desc = description ?? '';
    const startIdx = desc.indexOf(this.descriptionMetaSeparator);
    if (startIdx === -1) {
      return { format: null, people: [] };
    }
    const endIdx = desc.indexOf(this.descriptionMetaEnd, startIdx);
    if (endIdx === -1) {
      return { format: null, people: [] };
    }
    const block = desc.slice(
      startIdx + this.descriptionMetaSeparator.length,
      endIdx,
    );
    const lines = block.split('\n').map((l) => l.trim());
    const map: Record<string, string> = {};
    for (const line of lines) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      map[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
    let format: string | null = null;
    const fmtRaw = (map['format'] ?? '').trim();
    if (
      fmtRaw &&
      fmtRaw !== '-' &&
      ['talk', 'panel', 'hybrid', 'meetup'].includes(fmtRaw)
    ) {
      format = fmtRaw;
    }
    let people: { role: string; fullName: string }[] = [];
    const pj = map['people_json'];
    if (pj) {
      try {
        const decoded = decodeURIComponent(pj);
        const parsed: unknown = JSON.parse(decoded);
        if (Array.isArray(parsed)) {
          people = parsed.map((p: { role?: string; fullName?: string }) => ({
            role: typeof p?.role === 'string' ? p.role : 'speaker',
            fullName:
              typeof p?.fullName === 'string' ? p.fullName.trim() : '',
          }));
        }
      } catch {
        /* ignore invalid legacy payloads */
      }
    }
    return { format, people };
  }

  /** Matches organizer app rules for Panel format only. */
  private async ensurePeopleRulesForPublish(eventId: number, event: Event): Promise<void> {
    let rosterRows: EventProgramRoster[] = [];
    try {
      rosterRows = await this.eventProgramRosterRepo.find({ where: { eventId } });
    } catch {
      rosterRows = [];
    }

    let format: string | null = null;
    let legacyPeople: { role: string; fullName: string }[] = [];

    if (rosterRows.length === 0) {
      const parsed = this.parseDescriptionMeta(event.description ?? '');
      format = parsed.format;
      legacyPeople = parsed.people;
    }

    const formatToUse = format ?? event.eventFormat;
    if (!formatToUse || formatToUse === 'meetup') {
      return;
    }

    const people = rosterRows.length > 0
      ? rosterRows.map((r) => ({ role: r.role, fullName: r.displayName }))
      : legacyPeople;

    const panelists = people.filter(
      (p) => p.role === 'panelist' && p.fullName,
    );
    const moderators = people.filter(
      (p) => p.role === 'moderator' && p.fullName,
    );

    if (formatToUse === 'panel') {
      if (panelists.length < 2) {
        throw new BadRequestException(
          'Panel events require at least two panelists.',
        );
      }
      if (moderators.length < 1) {
        throw new BadRequestException(
          'Panel events require at least one moderator.',
        );
      }
    }
  }

  private async ensurePublishReady(event: Event) {
    if (
      !event.title ||
      !event.description ||
      !event.startDatetime ||
      !event.endDatetime ||
      !event.locationName
    ) {
      throw new BadRequestException(
        'Event is missing required fields for publishing',
      );
    }
    await this.ensurePeopleRulesForPublish(event.id, event);
  }

  async createEvent(organizerId: number, dto: CreateEventDto) {
    const user = await this.userRepo.findOne({ where: { id: organizerId } });

    if (!user) {
      throw new NotFoundException('Organizer not found');
    }

    this.ensureOrganizerActive(user);

    if (
      new Date(dto.startDatetime).getTime() >=
      new Date(dto.endDatetime).getTime()
    ) {
      throw new BadRequestException('startDatetime must be before endDatetime');
    }

    const { sponsors, roster, ...rest } = dto as CreateEventDto & {
      sponsors?: { name: string; logo?: string }[];
      roster?: {
        role: string;
        displayName: string;
        title?: string | null;
        sortOrder?: number;
        photoUrl?: string | null;
      }[];
    };

    const event = this.eventRepo.create({
      ...rest,
      organizerId,
      status: 'draft',
      eventFormat: dto.eventFormat ?? null,
    });

    const saved = await this.eventRepo.save(event);

    if (sponsors !== undefined) {
      await this.syncEventSponsors(saved.id, sponsors);
    }

    if (roster !== undefined) {
      await this.syncEventRoster(saved.id, roster);
    }

    return saved;
  }

  async publishEvent(eventId: number, organizerId: number) {
    const user = await this.userRepo.findOne({ where: { id: organizerId } });

    if (!user) {
      throw new NotFoundException('Organizer not found');
    }

    this.ensureOrganizerActive(user);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You do not own this event');
    }

    if (event.status === 'published') {
      throw new BadRequestException('Event is already published');
    }

    await this.ensurePublishReady(event);

    event.status = 'published';
    return this.eventRepo.save(event);
  }

  async deleteEvent(eventId: number, organizerId: number) {
    const user = await this.userRepo.findOne({ where: { id: organizerId } });
    if (!user) throw new NotFoundException('Organizer not found');
    this.ensureOrganizerActive(user);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You do not own this event');
    }

    await this.eventRepo.remove(event);
    return { success: true };
  }

  async updateEvent(
    eventId: number,
    organizerId: number,
    dto: UpdateEventDto,
  ) {
    const user = await this.userRepo.findOne({ where: { id: organizerId } });

    if (!user) {
      throw new NotFoundException('Organizer not found');
    }

    this.ensureOrganizerActive(user);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You do not own this event');
    }

    if (
      dto.startDatetime &&
      dto.endDatetime &&
      new Date(dto.startDatetime).getTime() >=
        new Date(dto.endDatetime).getTime()
    ) {
      throw new BadRequestException('startDatetime must be before endDatetime');
    }

    const { sponsors, roster, ...rest } = dto as UpdateEventDto & {
      sponsors?: { name: string; logo?: string }[];
      roster?: {
        role: string;
        displayName: string;
        title?: string | null;
        sortOrder?: number;
        photoUrl?: string | null;
      }[];
    };

    for (const key of Object.keys(rest) as (keyof typeof rest)[]) {
      const v = rest[key];
      if (v !== undefined) {
        (event as unknown as Record<string, unknown>)[key as string] = v as unknown;
      }
    }

    await this.eventRepo.save(event);

    if (sponsors !== undefined) {
      await this.syncEventSponsors(event.id, sponsors);
    }

    if (roster !== undefined) {
      await this.syncEventRoster(event.id, roster);
    }

    return event;
  }

  async getInterests() {
    const interests = await this.interestRepo.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
    return { interests };
  }

  async getAllEvents(
    currentUserId?: number,
    query: GetEventsQueryDto = {},
    currentUserRole?: number,
  ) {
    const userId =
      currentUserId === null || currentUserId === undefined
        ? undefined
        : currentUserId;
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const offset = (page - 1) * limit;

    let savedIds = new Set<number>();
    if (userId !== undefined) {
      const savedRows = await this.savedEventRepo.find({
        where: { userId },
        select: ['eventId'],
      });
      savedIds = new Set(savedRows.map((row) => row.eventId));
    }

    const qb = this.eventRepo
      .createQueryBuilder('event')
      .where('event.status = :status', { status: 'published' });

    const now = new Date();
    if (query.organizerId != null && Number.isFinite(Number(query.organizerId))) {
      qb.andWhere('event.organizerId = :filterOrganizerId', {
        filterOrganizerId: Number(query.organizerId),
      });
      if (query.organizerScope === 'upcoming') {
        qb.andWhere('event.startDatetime >= :organizerNow', { organizerNow: now });
      } else if (query.organizerScope === 'past') {
        qb.andWhere('event.startDatetime < :organizerNowPast', {
          organizerNowPast: now,
        });
      }
    }

    if (query.q?.trim()) {
      qb.andWhere(
        new Brackets((qbInner) => {
          qbInner
            .where('event.title LIKE :q', { q: `%${query.q?.trim()}%` })
            .orWhere('event.description LIKE :q', { q: `%${query.q?.trim()}%` })
            .orWhere('event.locationName LIKE :q', {
              q: `%${query.q?.trim()}%`,
            });
        }),
      );
    }

    if (query.interestId) {
      qb.andWhere('event.interestId = :interestId', {
        interestId: query.interestId,
      });
    }

    if (query.type && query.type !== 'any') {
      qb.andWhere('event.isPhysical = :isPhysical', {
        isPhysical: query.type === 'in-person',
      });
    }

    if (query.price && query.price !== 'any') {
      if (query.price === 'free') {
        qb.andWhere('event.totalPrice <= :freePrice', { freePrice: 0 });
      } else {
        qb.andWhere('event.totalPrice > :paidPrice', { paidPrice: 0 });
      }
    }

    if (query.eventFormat && query.eventFormat !== 'any') {
      qb.andWhere('LOWER(event.eventFormat) = :eventFormat', {
        eventFormat: query.eventFormat,
      });
    }

    if (query.city?.trim()) {
      qb.andWhere('event.locationName LIKE :city', {
        city: `%${query.city.trim()}%`,
      });
    }

    if (query.joinedOnly) {
      if (userId === undefined) {
        return {
          items: [],
          page,
          limit,
          total: 0,
          hasMore: false,
        };
      }
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM event_registrations reg_joined
          WHERE reg_joined.event_id = event.id
            AND reg_joined.member_id = :joinedUserId
        )`,
        { joinedUserId: userId },
      );
    }

    this.applyDateBucketFilter(qb, query.dateBucket);

    if (query.organizerScope === 'past') {
      qb.orderBy('event.startDatetime', 'DESC');
    } else if (query.sort === 'start-desc') {
      qb.orderBy('event.startDatetime', 'DESC');
    } else if (query.sort === 'popular' || query.sort === 'trending') {
      qb.addOrderBy(
        '(SELECT COUNT(*) FROM event_registrations reg_pop WHERE reg_pop.event_id = event.id)',
        'DESC',
      );
      qb.addOrderBy('event.startDatetime', 'ASC');
    } else {
      qb.orderBy('event.startDatetime', 'ASC');
    }

    const total = await qb.getCount();
    qb.skip(offset).take(limit);

    const events = await qb.getMany();

    const eventIds = events.map((event) => event.id);
    const countMap = new Map<number, number>();
    if (eventIds.length > 0) {
      const countRows = await this.eventRegistrationRepo.manager
        .createQueryBuilder()
        .select('reg.event_id', 'eventId')
        .addSelect('COUNT(*)', 'cnt')
        .from('event_registrations', 'reg')
        .where('reg.event_id IN (:...eventIds)', { eventIds })
        .groupBy('reg.event_id')
        .getRawMany<{ eventId: number | string; cnt: string }>();
      countRows.forEach((row) => {
        countMap.set(Number(row.eventId), parseInt(String(row.cnt), 10));
      });
    }

    let joinedSet = new Set<number>();
    if (userId !== undefined && eventIds.length > 0) {
      const joinedRows = await this.eventRegistrationRepo
        .createQueryBuilder('reg')
        .select('reg.event_id', 'eventId')
        .where('reg.member_id = :userId', { userId })
        .andWhere('reg.event_id IN (:...eventIds)', { eventIds })
        .groupBy('reg.event_id')
        .getRawMany<{ eventId: number | string }>();
      joinedSet = new Set(joinedRows.map((row) => Number(row.eventId)));
    }

    const attendeePreviewMap = await this.buildAttendeePreviewMap(eventIds, 3, {
      userId,
      role: currentUserRole,
    });

    const likeCountMap = new Map<number, number>();
    let likedEventIdSet = new Set<number>();
    if (eventIds.length > 0) {
      const likeCountRows = await this.eventLikeRepo.manager
        .createQueryBuilder()
        .select('el.event_id', 'eventId')
        .addSelect('COUNT(*)', 'cnt')
        .from('event_likes', 'el')
        .where('el.event_id IN (:...eventIds)', { eventIds })
        .groupBy('el.event_id')
        .getRawMany<{ eventId: number | string; cnt: string }>();
      likeCountRows.forEach((row) => {
        likeCountMap.set(Number(row.eventId), parseInt(String(row.cnt), 10));
      });

      if (userId !== undefined) {
        const likedRows = await this.eventLikeRepo.manager
          .createQueryBuilder()
          .select('el.event_id', 'eventId')
          .from('event_likes', 'el')
          .where('el.event_id IN (:...eventIds)', { eventIds })
          .andWhere('el.member_id = :userId', { userId })
          .getRawMany<{ eventId: number | string }>();
        likedEventIdSet = new Set(likedRows.map((row) => Number(row.eventId)));
      }
    }

    return {
      items: events.map((event) =>
        this.mapEventSummary(
          event,
          countMap.get(event.id) ?? 0,
          joinedSet.has(event.id),
          savedIds.has(event.id),
          attendeePreviewMap.get(event.id) ?? [],
          likeCountMap.get(event.id) ?? 0,
          likedEventIdSet.has(event.id),
        ),
      ),
      page,
      limit,
      total,
      hasMore: offset + events.length < total,
    };
  }

  private getLocationMatchScoreForEvent(event: Event, userLocation: string): number {
    const locationText = String(userLocation || '').trim().toLowerCase();
    if (!locationText) return 0;

    const eventLocation = String(event.locationName || '').trim().toLowerCase();
    const locationParts = locationText
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (
      eventLocation &&
      locationParts.some(
        (part) => part.includes(eventLocation) || eventLocation.includes(part),
      )
    ) {
      return 1;
    }
    if (locationParts.some((part) => part.length > 2 && eventLocation.includes(part))) {
      return 0.65;
    }
    return 0;
  }

  private async recordMemberEventInteraction(
    memberId: number,
    eventId: number,
    action: MemberEventInteractionAction,
    interestId?: number | null,
  ): Promise<void> {
    const row = this.memberEventInteractionRepo.create({
      memberId,
      eventId,
      interestId: interestId ?? null,
      action,
      createdAt: new Date(),
    });
    await this.memberEventInteractionRepo.save(row);
  }

  async trackEventInteraction(
    memberId: number,
    eventId: number,
    action: MemberEventInteractionAction,
  ) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    this.ensureMember(member);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event || event.status !== 'published') {
      throw new NotFoundException('Event not found');
    }

    await this.recordMemberEventInteraction(
      memberId,
      eventId,
      action,
      event.interestId,
    );
    return { tracked: true, action, eventId };
  }

  private buildNormalizedTasteProfile(
    explicitInterestIds: number[],
    attendanceByInterest: Map<number, number>,
    savedByInterest: Map<number, number>,
    browsingByInterest: Map<number, number>,
  ): Map<number, number> {
    const taste = new Map<number, number>();
    const explicitSet = new Set(explicitInterestIds);

    for (const interestId of explicitInterestIds) {
      taste.set(interestId, (taste.get(interestId) ?? 0) + 1);
    }

    attendanceByInterest.forEach((count, interestId) => {
      taste.set(interestId, (taste.get(interestId) ?? 0) + count * 0.35);
    });

    savedByInterest.forEach((count, interestId) => {
      let boost = count * 0.25;
      if (!explicitSet.has(interestId)) {
        boost += count * 0.2;
      }
      taste.set(interestId, (taste.get(interestId) ?? 0) + boost);
    });

    browsingByInterest.forEach((weightedScore, interestId) => {
      taste.set(interestId, (taste.get(interestId) ?? 0) + weightedScore * 0.12);
    });

    const max = Math.max(...Array.from(taste.values()), 1);
    const normalized = new Map<number, number>();
    taste.forEach((value, interestId) => {
      normalized.set(interestId, value / max);
    });
    return normalized;
  }

  private scoreRecommendedCandidate(
    event: Event,
    tasteProfile: Map<number, number>,
    userLocation: string,
  ): number {
    const tasteScore = tasteProfile.get(event.interestId) ?? 0;
    const locationScore = this.getLocationMatchScoreForEvent(event, userLocation);
    return tasteScore * 0.85 + locationScore * 0.15;
  }

  async getRecommendedEvents(
    memberId: number,
    viewerRole?: number,
    limit = 8,
  ) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    this.ensureMember(member);

    const safeLimit = Math.min(20, Math.max(1, limit));
    const now = new Date();

    const explicitInterestRows = await this.memberInterestRepo.manager
      .createQueryBuilder()
      .select('mi.interest_id', 'interestId')
      .from('member_interests', 'mi')
      .where('mi.member_id = :memberId', { memberId })
      .getRawMany<{ interestId: number | string }>();
    const explicitInterestIds = explicitInterestRows
      .map((row) => Number(row.interestId))
      .filter((id) => Number.isFinite(id) && id > 0);
    const explicitInterestSet = new Set(explicitInterestIds);

    const attendanceRows = await this.eventRegistrationRepo.manager
      .createQueryBuilder()
      .select('event.interest_id', 'interestId')
      .addSelect('COUNT(*)', 'count')
      .from('event_registrations', 'reg')
      .innerJoin('events', 'event', 'event.id = reg.event_id')
      .where('reg.member_id = :memberId', { memberId })
      .andWhere('event.status = :status', { status: 'published' })
      .groupBy('event.interest_id')
      .getRawMany<{ interestId: number | string; count: string }>();

    const savedInterestRows = await this.savedEventRepo.manager
      .createQueryBuilder()
      .select('event.interest_id', 'interestId')
      .addSelect('COUNT(*)', 'count')
      .from('saved_events', 'saved')
      .innerJoin('events', 'event', 'event.id = saved.event_id')
      .where('saved.user_id = :memberId', { memberId })
      .andWhere('event.status = :status', { status: 'published' })
      .groupBy('event.interest_id')
      .getRawMany<{ interestId: number | string; count: string }>();

    const attendanceByInterest = new Map<number, number>();
    attendanceRows.forEach((row) => {
      const interestId = Number(row.interestId);
      if (!Number.isFinite(interestId) || interestId <= 0) return;
      attendanceByInterest.set(interestId, parseInt(String(row.count), 10) || 0);
    });

    const savedByInterest = new Map<number, number>();
    savedInterestRows.forEach((row) => {
      const interestId = Number(row.interestId);
      if (!Number.isFinite(interestId) || interestId <= 0) return;
      savedByInterest.set(interestId, parseInt(String(row.count), 10) || 0);
    });

    const browsingRows = await this.memberEventInteractionRepo.manager
      .createQueryBuilder()
      .select('interaction.interest_id', 'interestId')
      .addSelect('interaction.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .from('member_event_interactions', 'interaction')
      .where('interaction.member_id = :memberId', { memberId })
      .andWhere('interaction.action IN (:...actions)', {
        actions: ['viewed', 'opened', 'shared'],
      })
      .andWhere('interaction.interest_id IS NOT NULL')
      .groupBy('interaction.interest_id')
      .addGroupBy('interaction.action')
      .getRawMany<{ interestId: number | string; action: string; count: string }>();

    const browsingByInterest = new Map<number, number>();
    browsingRows.forEach((row) => {
      const interestId = Number(row.interestId);
      const action = String(row.action) as keyof typeof BROWSING_TASTE_WEIGHTS;
      const weight = BROWSING_TASTE_WEIGHTS[action];
      if (!Number.isFinite(interestId) || interestId <= 0 || !weight) return;
      const count = parseInt(String(row.count), 10) || 0;
      browsingByInterest.set(
        interestId,
        (browsingByInterest.get(interestId) ?? 0) + count * weight,
      );
    });

    const tasteProfile = this.buildNormalizedTasteProfile(
      explicitInterestIds,
      attendanceByInterest,
      savedByInterest,
      browsingByInterest,
    );

    const interestNameRows = await this.interestRepo.find({
      select: ['id', 'name'],
    });
    const interestNames = new Map(
      interestNameRows.map((row) => [row.id, row.name]),
    );

    const candidateEvents = await this.eventRepo
      .createQueryBuilder('event')
      .where('event.status = :status', { status: 'published' })
      .andWhere('event.startDatetime >= :now', { now })
      .andWhere(
        `NOT EXISTS (
          SELECT 1
          FROM event_registrations reg
          WHERE reg.event_id = event.id
            AND reg.member_id = :memberId
        )`,
        { memberId },
      )
      .orderBy('event.startDatetime', 'ASC')
      .take(120)
      .getMany();

    const candidateIds = candidateEvents.map((event) => event.id);
    const countMap = new Map<number, number>();
    if (candidateIds.length > 0) {
      const countRows = await this.eventRegistrationRepo.manager
        .createQueryBuilder()
        .select('reg.event_id', 'eventId')
        .addSelect('COUNT(*)', 'cnt')
        .from('event_registrations', 'reg')
        .where('reg.event_id IN (:...eventIds)', { eventIds: candidateIds })
        .groupBy('reg.event_id')
        .getRawMany<{ eventId: number | string; cnt: string }>();
      countRows.forEach((row) => {
        countMap.set(Number(row.eventId), parseInt(String(row.cnt), 10));
      });
    }

    const scoredCandidates = candidateEvents
      .map((event) => ({
        event,
        score: this.scoreRecommendedCandidate(
          event,
          tasteProfile,
          member.location ?? '',
        ),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (
          new Date(a.event.startDatetime).getTime() -
          new Date(b.event.startDatetime).getTime()
        );
      });

    const topEvents = scoredCandidates.slice(0, safeLimit).map((row) => row.event);
    const topEventIds = topEvents.map((event) => event.id);

    const savedRows = await this.savedEventRepo.find({
      where: { userId: memberId },
      select: ['eventId'],
    });
    const savedIds = new Set(savedRows.map((row) => row.eventId));

    const attendeePreviewMap = await this.buildAttendeePreviewMap(topEventIds, 3, {
      userId: memberId,
      role: viewerRole,
    });

    const likeCountMap = new Map<number, number>();
    let likedEventIdSet = new Set<number>();
    if (topEventIds.length > 0) {
      const likeCountRows = await this.eventLikeRepo.manager
        .createQueryBuilder()
        .select('el.event_id', 'eventId')
        .addSelect('COUNT(*)', 'cnt')
        .from('event_likes', 'el')
        .where('el.event_id IN (:...eventIds)', { eventIds: topEventIds })
        .groupBy('el.event_id')
        .getRawMany<{ eventId: number | string; cnt: string }>();
      likeCountRows.forEach((row) => {
        likeCountMap.set(Number(row.eventId), parseInt(String(row.cnt), 10));
      });

      const likedRows = await this.eventLikeRepo.manager
        .createQueryBuilder()
        .select('el.event_id', 'eventId')
        .from('event_likes', 'el')
        .where('el.event_id IN (:...eventIds)', { eventIds: topEventIds })
        .andWhere('el.member_id = :memberId', { memberId })
        .getRawMany<{ eventId: number | string }>();
      likedEventIdSet = new Set(likedRows.map((row) => Number(row.eventId)));
    }

    const tasteProfileMeta = Array.from(tasteProfile.entries())
      .map(([interestId, score]) => ({
        interestId,
        name: interestNames.get(interestId) ?? 'Unknown',
        score: Math.round(score * 100) / 100,
        explicit: explicitInterestSet.has(interestId),
        attended: attendanceByInterest.get(interestId) ?? 0,
        saved: savedByInterest.get(interestId) ?? 0,
        browsed: Math.round((browsingByInterest.get(interestId) ?? 0) * 10) / 10,
      }))
      .sort((a, b) => b.score - a.score);

    return {
      items: topEvents.map((event) =>
        this.mapEventSummary(
          event,
          countMap.get(event.id) ?? 0,
          false,
          savedIds.has(event.id),
          attendeePreviewMap.get(event.id) ?? [],
          likeCountMap.get(event.id) ?? 0,
          likedEventIdSet.has(event.id),
        ),
      ),
      meta: {
        limit: safeLimit,
        totalCandidates: candidateEvents.length,
        tasteProfile: tasteProfileMeta,
      },
    };
  }

  async getEventById(
    eventId: number,
    currentUserId?: number,
    currentUserRole?: number,
  ) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'published' && event.organizerId !== currentUserId) {
      throw new NotFoundException('Event not found');
    }

    return this.formatEventDetails(event, currentUserId, currentUserRole);
  }

  async joinEvent(eventId: number, memberId: number) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    this.ensureMember(member);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizerId === memberId) {
      throw new BadRequestException('Organizer cannot join their own event');
    }

    if (event.status !== 'published') {
      throw new BadRequestException('Only published events can be joined');
    }

    const existingRegistration = await this.eventRegistrationRepo.findOne({
      where: { eventId: eventId, memberId: memberId },
    });

    if (existingRegistration) {
      throw new BadRequestException('You have already joined this event');
    }

    const attendeesCount = await this.eventRegistrationRepo.count({
      where: { eventId: eventId },
    });

    if (attendeesCount >= event.capacity) {
      throw new BadRequestException('Event is full');
    }

    const registration = this.eventRegistrationRepo.create({
      eventId: event.id,
      memberId: memberId,
      status: 'registered',
      ticketQr: `QR_${Date.now()}`,
      createdAt: new Date(),
    });

    try {
      const savedRegistration = await this.eventRegistrationRepo.save(registration);
      void this.recordMemberEventInteraction(
        memberId,
        event.id,
        'registered',
        event.interestId,
      ).catch(() => undefined);
      return savedRegistration;
    } catch (error) {
      const mysqlCode = (error as { code?: string })?.code;
      if (error instanceof QueryFailedError && mysqlCode === 'ER_DUP_ENTRY') {
        throw new BadRequestException('You have already joined this event');
      }
      throw error;
    }
  }

  async leaveEvent(eventId: number, memberId: number) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    this.ensureMember(member);

    const registration = await this.eventRegistrationRepo.findOne({
      where: { eventId, memberId },
    });
    if (!registration) {
      return { joined: false, message: 'You are not joined to this event' };
    }

    await this.eventRegistrationRepo.delete({ id: registration.id });
    return { joined: false, message: 'You have left the event' };
  }

  async likeEvent(eventId: number, memberId: number) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    this.ensureMember(member);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event || event.status !== 'published') {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.eventLikeRepo.findOne({
      where: { eventId, memberId },
      select: ['id'],
    });
    if (!existing) {
      const row = this.eventLikeRepo.create({ eventId, memberId });
      try {
        await this.eventLikeRepo.save(row);
      } catch (error) {
        const mysqlCode = (error as { code?: string })?.code;
        if (!(error instanceof QueryFailedError && mysqlCode === 'ER_DUP_ENTRY')) {
          throw error;
        }
      }
    }

    const likeCount = await this.eventLikeRepo.count({ where: { eventId } });
    return { liked: true, likeCount };
  }

  async unlikeEvent(eventId: number, memberId: number) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    this.ensureMember(member);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event || event.status !== 'published') {
      throw new NotFoundException('Event not found');
    }

    await this.eventLikeRepo.delete({ eventId, memberId });
    const likeCount = await this.eventLikeRepo.count({ where: { eventId } });
    return { liked: false, likeCount };
  }

  async saveEvent(eventId: number, memberId: number) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    this.ensureMember(member);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event || event.status !== 'published') {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.savedEventRepo.findOne({
      where: { userId: memberId, eventId },
    });
    if (existing) {
      return { saved: true, message: 'Event already saved' };
    }

    const saved = this.savedEventRepo.create({
      userId: memberId,
      eventId,
      savedAt: new Date(),
    });
    await this.savedEventRepo.save(saved);
    void this.recordMemberEventInteraction(
      memberId,
      eventId,
      'saved',
      event.interestId,
    ).catch(() => undefined);
    return { saved: true, message: 'Event saved successfully' };
  }

  async unsaveEvent(eventId: number, memberId: number) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    this.ensureMember(member);

    const existing = await this.savedEventRepo.findOne({
      where: { userId: memberId, eventId },
    });
    if (!existing) {
      return { saved: false, message: 'Event is not saved' };
    }

    await this.savedEventRepo.delete({ id: existing.id });
    return { saved: false, message: 'Event removed from saved list' };
  }

  async getSavedEvents(memberId: number, viewerRole?: number) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    this.ensureMember(member);

    const savedRows = await this.savedEventRepo.find({
      where: { userId: memberId },
      select: ['eventId', 'savedAt'],
      order: { savedAt: 'DESC' },
    });

    if (!savedRows.length) {
      return [];
    }

    const savedEventIds = savedRows.map((row) => row.eventId);
    const events = await this.eventRepo.findByIds(savedEventIds);
    const eventMap = new Map(events.map((event) => [event.id, event]));

    const countRows = await this.eventRegistrationRepo.manager
      .createQueryBuilder()
      .select('reg.event_id', 'eventId')
      .addSelect('COUNT(*)', 'cnt')
      .from('event_registrations', 'reg')
      .where('reg.event_id IN (:...eventIds)', { eventIds: savedEventIds })
      .groupBy('reg.event_id')
      .getRawMany<{ eventId: number | string; cnt: string }>();

    const countMap = new Map<number, number>(
      countRows.map((row) => [
        Number(row.eventId),
        parseInt(String(row.cnt), 10),
      ]),
    );

    const joinedRows = await this.eventRegistrationRepo
      .createQueryBuilder('reg')
      .select('reg.event_id', 'eventId')
      .where('reg.member_id = :memberId', { memberId })
      .andWhere('reg.event_id IN (:...eventIds)', { eventIds: savedEventIds })
      .getRawMany<{ eventId: number | string }>();
    const joinedSet = new Set(joinedRows.map((row) => Number(row.eventId)));
    const savedSet = new Set(savedEventIds);

    const attendeePreviewMap = await this.buildAttendeePreviewMap(savedEventIds, 3, {
      userId: memberId,
      role: viewerRole,
    });

    const likeCountMap = new Map<number, number>();
    let likedEventIdSet = new Set<number>();
    if (savedEventIds.length > 0) {
      const likeCountRows = await this.eventLikeRepo.manager
        .createQueryBuilder()
        .select('el.event_id', 'eventId')
        .addSelect('COUNT(*)', 'cnt')
        .from('event_likes', 'el')
        .where('el.event_id IN (:...eventIds)', { eventIds: savedEventIds })
        .groupBy('el.event_id')
        .getRawMany<{ eventId: number | string; cnt: string }>();
      likeCountRows.forEach((row) => {
        likeCountMap.set(Number(row.eventId), parseInt(String(row.cnt), 10));
      });

      const likedRows = await this.eventLikeRepo.manager
        .createQueryBuilder()
        .select('el.event_id', 'eventId')
        .from('event_likes', 'el')
        .where('el.event_id IN (:...eventIds)', { eventIds: savedEventIds })
        .andWhere('el.member_id = :memberId', { memberId })
        .getRawMany<{ eventId: number | string }>();
      likedEventIdSet = new Set(likedRows.map((row) => Number(row.eventId)));
    }

    return savedRows
      .map((row) => eventMap.get(row.eventId))
      .filter((event): event is Event =>
        Boolean(event && event.status === 'published'),
      )
      .map((event) =>
        this.mapEventSummary(
          event,
          countMap.get(event.id) ?? 0,
          joinedSet.has(event.id),
          savedSet.has(event.id),
          attendeePreviewMap.get(event.id) ?? [],
          likeCountMap.get(event.id) ?? 0,
          likedEventIdSet.has(event.id),
        ),
      );
  }

  async getEventAttendees(
    eventId: number,
    options?: { page?: number; limit?: number },
    viewer?: { userId?: number; role?: number } | null,
  ) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event || event.status !== 'published') {
      throw new NotFoundException('Event not found');
    }

    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(50, Math.max(1, options?.limit ?? 20));
    const offset = (page - 1) * limit;

    const qb = this.eventRegistrationRepo
      .createQueryBuilder('reg')
      .innerJoin(User, 'user', 'user.id = reg.member_id')
      .where('reg.event_id = :eventId', { eventId })
      .select('reg.id', 'registrationId')
      .addSelect('reg.created_at', 'joinedAt')
      .addSelect('user.id', 'userId')
      .addSelect('user.full_name', 'fullName')
      .addSelect('user.profile_img', 'profileImg')
      .addSelect('user.profile_hidden', 'profileHidden')
      .orderBy('reg.created_at', 'DESC');

    const total = await qb.getCount();
    const rows = await qb.offset(offset).limit(limit).getRawMany<{
      registrationId: number | string;
      joinedAt: Date | string;
      userId: number | string;
      fullName: string;
      profileImg: string | null;
      profileHidden?: number | boolean | string;
    }>();

    const viewerId = viewer?.userId != null ? Number(viewer.userId) : null;
    const canRevealHidden = canViewerSeeHiddenProfile(viewer);

    return {
      items: rows.map((row) => {
        const uid = Number(row.userId);
        const isSelf = viewerId != null && viewerId === uid;
        const profileHidden = Boolean((row as { profileHidden?: unknown }).profileHidden);
        const shouldMask = profileHidden && !canRevealHidden && !isSelf;
        return {
          id: shouldMask ? null : uid,
          name: shouldMask ? 'Anonymous' : row.fullName,
          avatar: shouldMask ? null : row.profileImg,
          joinedAt: row.joinedAt,
          isAnonymous: shouldMask ? true : undefined,
        };
      }),
      page,
      limit,
      total,
      hasMore: offset + rows.length < total,
    };
  }

  async formatEventDetails(
    event: Event,
    currentUserId?: number,
    currentUserRole?: number,
  ) {
    const userRegistrationPromise =
      currentUserId != null
        ? this.eventRegistrationRepo
            .createQueryBuilder('reg')
            .select('reg.id', 'registrationId')
            .where('reg.event_id = :eventId AND reg.member_id = :memberId', {
              eventId: event.id,
              memberId: currentUserId,
            })
            .getRawOne<{ registrationId: number }>()
        : Promise.resolve(null);

    const userSavedPromise =
      currentUserId != null
        ? this.savedEventRepo.findOne({
            where: { userId: currentUserId, eventId: event.id },
            select: ['id'],
          })
        : Promise.resolve(null);

    const [
      organizer,
      profile,
      sponsors,
      attendeesCount,
      attendeePreviewMap,
      userRegistrationRow,
      userSavedRow,
      rosterRows,
      likeCount,
      userLikeRow,
    ] = await Promise.all([
      this.userRepo.findOne({ where: { id: event.organizerId } }),
      this.organizerProfileRepo.findOne({
        where: { userId: event.organizerId },
      }),
      this.eventSponsorRepo.find({ where: { eventId: event.id } }),
      this.eventRegistrationRepo.count({ where: { eventId: event.id } }),
      this.buildAttendeePreviewMap([event.id], 3, {
        userId: currentUserId,
        role: currentUserRole,
      }),
      userRegistrationPromise,
      userSavedPromise,
      this.eventProgramRosterRepo.find({
        where: { eventId: event.id },
        order: { sortOrder: 'ASC' },
      }),
      this.eventLikeRepo.count({ where: { eventId: event.id } }),
      currentUserId != null
        ? this.eventLikeRepo.findOne({
            where: { eventId: event.id, memberId: currentUserId },
            select: ['id'],
          })
        : Promise.resolve(null),
    ]);

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    return {
      id: event.id,
      organizerId: event.organizerId,
      status: event.status,
      interestId: event.interestId,
      title: event.title,
      description: event.description,
      image: event.coverImage ?? null,
      coverImage: event.coverImage ?? null,
      capacity: event.capacity,
      startsAt: event.startDatetime,
      endsAt: event.endDatetime,
      city: event.locationName ?? null,
      locationName: event.locationName ?? null,
      locationAddress: event.locationAddress ?? null,
      isOnline: !event.isPhysical,
      priceType: event.totalPrice > 0 ? 'Paid' : 'Free',
      priceAmount: event.totalPrice > 0 ? event.totalPrice : null,
      goingCount: attendeesCount,
      datetime: {
        start: event.startDatetime,
        end: event.endDatetime,
      },
      location: {
        name: event.locationName ?? null,
        address: event.locationAddress ?? null,
        latitude: event.locationLatitude ?? null,
        longitude: event.locationLongitude ?? null,
      },
      locationLatitude: event.locationLatitude ?? null,
      locationLongitude: event.locationLongitude ?? null,
      eventFormat: event.eventFormat ?? null,
      organizer: {
        name: profile?.organizationName || organizer.fullName,
        description: profile?.organizationDescription || '',
        bio: profile?.organizationDescription || '',
        avatar: organizer.profileImg ?? null,
        verificationStatus: profile?.verificationStatus ?? null,
      },
      sponsors:
        sponsors?.map((s) => ({
          id: s.id,
          name: s.sponsorName,
          logo: s.sponsorLogo,
        })) ?? [],
      attendeesCount,
      attendeePreviews: attendeePreviewMap.get(event.id) ?? [],
      price: event.totalPrice,
      joined:
        userRegistrationRow != null &&
        userRegistrationRow.registrationId != null,
      isJoined:
        userRegistrationRow != null &&
        userRegistrationRow.registrationId != null,
      isSaved: userSavedRow != null,
      likeCount,
      isLiked: userLikeRow != null,
      roster:
        rosterRows?.map((r) => ({
          id: r.id,
          role: r.role,
          displayName: r.displayName,
          title: r.title,
          photoUrl: r.photoUrl,
          sortOrder: r.sortOrder,
        })) ?? [],
    };
  }
}
