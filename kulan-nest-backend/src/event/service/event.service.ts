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
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

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
      userId: number;
      avatar: string | null;
      name: string;
    }[],
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
      isOnline: !event.isPhysical,
      priceType: event.totalPrice > 0 ? 'Paid' : 'Free',
      priceAmount: event.totalPrice > 0 ? event.totalPrice : null,
      goingCount: attendeesCount,
      isJoined: joined,
      datetime: {
        start: event.startDatetime,
        end: event.endDatetime,
      },
      location: {
        name: event.locationName ?? null,
        address: event.locationAddress ?? null,
      },
      price: event.totalPrice,
      attendeesCount,
      joined,
      isSaved,
      attendeePreviews: attendeePreviews ?? [],
    };
  }

  private async buildAttendeePreviewMap(
    eventIds: number[],
    previewLimit = 3,
  ): Promise<
    Map<number, { userId: number; avatar: string | null; name: string }[]>
  > {
    const attendeePreviewMap = new Map<
      number,
      { userId: number; avatar: string | null; name: string }[]
    >();
    if (!eventIds.length) {
      return attendeePreviewMap;
    }

    const previewRows = await this.eventRegistrationRepo.manager
      .createQueryBuilder()
      .select('reg.event_id', 'eventId')
      .addSelect('reg.member_id', 'userId')
      .addSelect('user.profile_img', 'profileImg')
      .addSelect('user.full_name', 'fullName')
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

      list.push({
        userId: uid,
        avatar: typeof profileImg === 'string' ? profileImg : null,
        name:
          typeof fullName === 'string' && fullName.trim()
            ? fullName.trim()
            : 'Member',
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

  /** Matches organizer app rules for Talk / Panel / Hybrid / Meetup. */
  private ensurePeopleRulesForPublish(description: string): void {
    const { format, people } = this.parseDescriptionMeta(description);
    if (!format || format === 'meetup') {
      return;
    }
    const speakers = people.filter(
      (p) => p.role === 'speaker' && p.fullName,
    );
    const panelists = people.filter(
      (p) => p.role === 'panelist' && p.fullName,
    );
    const moderators = people.filter(
      (p) => p.role === 'moderator' && p.fullName,
    );

    if (format === 'talk') {
      if (speakers.length < 1) {
        throw new BadRequestException(
          'Talk events require at least one speaker.',
        );
      }
      return;
    }
    if (format === 'panel') {
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
      return;
    }
    if (format === 'hybrid') {
      if (speakers.length < 1) {
        throw new BadRequestException(
          'Hybrid events require at least one speaker.',
        );
      }
      if (panelists.length < 2) {
        throw new BadRequestException(
          'Hybrid events require at least two panelists.',
        );
      }
    }
  }

  private ensurePublishReady(event: Event) {
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
    this.ensurePeopleRulesForPublish(event.description ?? '');
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

    const { sponsors, ...rest } = dto as CreateEventDto & {
      sponsors?: { name: string; logo?: string }[];
    };

    const event = this.eventRepo.create({
      ...rest,
      organizerId,
      status: 'draft',
    });

    const saved = await this.eventRepo.save(event);

    if (sponsors !== undefined) {
      await this.syncEventSponsors(saved.id, sponsors);
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

    this.ensurePublishReady(event);

    event.status = 'published';
    return this.eventRepo.save(event);
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

    const { sponsors, ...rest } = dto;

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

    return event;
  }

  async getInterests() {
    const interests = await this.interestRepo.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
    return { interests };
  }

  async getAllEvents(currentUserId?: number, query: GetEventsQueryDto = {}) {
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

    if (query.sort === 'start-desc') {
      qb.orderBy('event.startDatetime', 'DESC');
    } else if (query.sort === 'popular') {
      qb.leftJoin(
        'event_registrations',
        'reg_count',
        'reg_count.event_id = event.id',
      );
      qb.groupBy('event.id');
      qb.orderBy('COUNT(reg_count.id)', 'DESC');
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

    const attendeePreviewMap = await this.buildAttendeePreviewMap(eventIds);

    return {
      items: events.map((event) =>
        this.mapEventSummary(
          event,
          countMap.get(event.id) ?? 0,
          joinedSet.has(event.id),
          savedIds.has(event.id),
          attendeePreviewMap.get(event.id) ?? [],
        ),
      ),
      page,
      limit,
      total,
      hasMore: offset + events.length < total,
    };
  }

  async getEventById(eventId: number, currentUserId?: number) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'published' && event.organizerId !== currentUserId) {
      throw new NotFoundException('Event not found');
    }

    return this.formatEventDetails(event, currentUserId);
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
      return await this.eventRegistrationRepo.save(registration);
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

  async getSavedEvents(memberId: number) {
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

    const attendeePreviewMap =
      await this.buildAttendeePreviewMap(savedEventIds);

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
        ),
      );
  }

  async getEventAttendees(
    eventId: number,
    options?: { page?: number; limit?: number },
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
      .orderBy('reg.created_at', 'DESC');

    const total = await qb.getCount();
    const rows = await qb.offset(offset).limit(limit).getRawMany<{
      registrationId: number | string;
      joinedAt: Date | string;
      userId: number | string;
      fullName: string;
      profileImg: string | null;
    }>();

    return {
      items: rows.map((row) => ({
        id: Number(row.userId),
        name: row.fullName,
        avatar: row.profileImg,
        joinedAt: row.joinedAt,
      })),
      page,
      limit,
      total,
      hasMore: offset + rows.length < total,
    };
  }

  async formatEventDetails(event: Event, currentUserId?: number) {
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
    ] = await Promise.all([
      this.userRepo.findOne({ where: { id: event.organizerId } }),
      this.organizerProfileRepo.findOne({
        where: { userId: event.organizerId },
      }),
      this.eventSponsorRepo.find({ where: { eventId: event.id } }),
      this.eventRegistrationRepo.count({ where: { eventId: event.id } }),
      this.buildAttendeePreviewMap([event.id]),
      userRegistrationPromise,
      userSavedPromise,
    ]);

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    return {
      id: event.id,
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
      },
      organizer: {
        name: profile?.organizationName || organizer.fullName,
        description: profile?.organizationDescription || '',
        bio: profile?.organizationDescription || '',
        avatar: organizer.profileImg ?? null,
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
    };
  }
}
