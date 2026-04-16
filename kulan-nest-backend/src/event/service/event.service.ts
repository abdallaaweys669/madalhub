import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from '../DTO/create-event.dto';
import { Event } from 'src/database/entities/event.entity';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { EventSponsor } from 'src/database/entities/event-sponsor.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

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
  ) {}

  private ensureOrganizerActive(user: User) {
    if (user.roleId !== 2) {
      throw new ForbiddenException('Only organizers can perform this action');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('Organizer must be active');
    }
  }

  private ensurePublishReady(event: Event) {
    if (!event.title || !event.description || !event.startDatetime || !event.endDatetime || !event.locationName) {
      throw new BadRequestException('Event is missing required fields for publishing');
    }
  }

  async createEvent(organizerId: number, dto: CreateEventDto) {
    const user = await this.userRepo.findOne({ where: { id: organizerId } });

    if (!user) {
      throw new NotFoundException('Organizer not found');
    }

    this.ensureOrganizerActive(user);

    if (new Date(dto.startDatetime).getTime() >= new Date(dto.endDatetime).getTime()) {
      throw new BadRequestException('startDatetime must be before endDatetime');
    }

    const event = this.eventRepo.create({
      ...dto,
      organizerId,
      status: 'draft',
    });

    return this.eventRepo.save(event);
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

  async getAllEvents() {
    const events = await this.eventRepo.find({
      where: { status: 'published' },
      order: { startDatetime: 'ASC' },
    });

    return Promise.all(
      events.map((event) => this.formatEventDetails(event)),
    );
  }

  async getEventById(eventId: number, currentUserId?: number) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'published' && event.organizerId !== currentUserId) {
      throw new NotFoundException('Event not found');
    }

    return this.formatEventDetails(event);
  }

  async joinEvent(eventId: number, memberId: number) {
    const member = await this.userRepo.findOne({ where: { id: memberId } });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.roleId !== 1) {
      throw new ForbiddenException('Only members can join events');
    }

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

    return this.eventRegistrationRepo.save(registration);
  }

  async formatEventDetails(event: Event) {
    const [organizer, profile, sponsors, attendeesCount] = await Promise.all([
      this.userRepo.findOne({ where: { id: event.organizerId } }),
      this.organizerProfileRepo.findOne({ where: { user_id: event.organizerId } }),
      this.eventSponsorRepo.find({ where: { event_id: event.id } }),
      this.eventRegistrationRepo.count({ where: { eventId: event.id } }),
    ]);

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      image: event.coverImage ?? null,
      datetime: {
        start: event.startDatetime,
        end: event.endDatetime,
      },
      location: {
        name: event.locationName ?? null,
        address: event.locationAddress ?? null,
      },
      organizer: {
        name: profile?.organization_name || organizer.fullName,
        bio: profile?.organization_description || '',
        avatar: organizer.profileImg ?? null,
      },
      sponsors: sponsors ?? [],
      attendeesCount,
      price: event.totalPrice,
    };
  }
}
