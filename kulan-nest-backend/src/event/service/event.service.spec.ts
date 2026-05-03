import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventService } from './event.service';
import { Event } from 'src/database/entities/event.entity';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { EventSponsor } from 'src/database/entities/event-sponsor.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { Interest } from 'src/database/entities/interest.entity';
import { SavedEvent } from 'src/database/entities/saved-event.entity';

describe('EventService - Organizer Status Gating & Owner Scoping', () => {
  let service: EventService;
  let eventRepo: jest.Mocked<Repository<Event>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findByIds: jest.fn(),
    manager: { createQueryBuilder: jest.fn() },
    createQueryBuilder: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawMany: jest.fn(),
    getCount: jest.fn(),
    getRawOne: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: getRepositoryToken(Event), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(OrganizerProfile), useFactory: mockRepo },
        { provide: getRepositoryToken(EventSponsor), useFactory: mockRepo },
        {
          provide: getRepositoryToken(EventRegistration),
          useFactory: mockRepo,
        },
        { provide: getRepositoryToken(Interest), useFactory: mockRepo },
        { provide: getRepositoryToken(SavedEvent), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventRepo = module.get(getRepositoryToken(Event));
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('createEvent - status gating', () => {
    it('should allow active organizer to create event', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
        status: 'active',
      } as unknown as User);

      eventRepo.create.mockReturnValue({
        id: 1,
        organizerId: 1,
        status: 'draft',
      } as Event);

      eventRepo.save.mockResolvedValue({
        id: 1,
        organizerId: 1,
        status: 'draft',
      } as Event);

      const result = await service.createEvent(1, {
        title: 'Test Event',
        description: 'Test',
        startDatetime: '2026-06-01T10:00:00Z',
        endDatetime: '2026-06-01T12:00:00Z',
        locationName: 'Test Location',
        isPhysical: true,
        capacity: 100,
        interestId: 1,
        totalPrice: 0,
      });

      expect(result.status).toBe('draft');
    });

    it('should reject pending organizer from creating event', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
        status: 'pending',
      } as unknown as User);

      await expect(
        service.createEvent(1, {
          title: 'Test Event',
          description: 'Test',
          startDatetime: '2026-06-01T10:00:00Z',
          endDatetime: '2026-06-01T12:00:00Z',
          locationName: 'Test Location',
          isPhysical: true,
          capacity: 100,
          interestId: 1,
          totalPrice: 0,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject rejected organizer from creating event', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
        status: 'rejected',
      } as unknown as User);

      await expect(
        service.createEvent(1, {
          title: 'Test Event',
          description: 'Test',
          startDatetime: '2026-06-01T10:00:00Z',
          endDatetime: '2026-06-01T12:00:00Z',
          locationName: 'Test Location',
          isPhysical: true,
          capacity: 100,
          interestId: 1,
          totalPrice: 0,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('publishEvent - owner scoping', () => {
    it('should allow organizer to publish their own event', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
        status: 'active',
      } as unknown as User);

      eventRepo.findOne.mockResolvedValue({
        id: 1,
        organizerId: 1,
        title: 'Test Event',
        description: 'Test',
        startDatetime: new Date('2026-06-01T10:00:00Z'),
        endDatetime: new Date('2026-06-01T12:00:00Z'),
        locationName: 'Test Location',
        status: 'draft',
      } as Event);

      eventRepo.save.mockResolvedValue({
        id: 1,
        organizerId: 1,
        status: 'published',
      } as Event);

      const result = await service.publishEvent(1, 1);

      expect(result.status).toBe('published');
    });

    it('should reject organizer trying to publish another organizer event', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
        status: 'active',
      } as unknown as User);

      eventRepo.findOne.mockResolvedValue({
        id: 1,
        organizerId: 2,
        status: 'draft',
      } as Event);

      await expect(service.publishEvent(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateEvent - owner scoping + status gating', () => {
    it('should allow active organizer to update their own event', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
        status: 'active',
      } as unknown as User);

      const existingEvent = {
        id: 1,
        organizerId: 1,
        title: 'Old Title',
        description: 'Old Desc',
        startDatetime: new Date('2026-06-01T10:00:00Z'),
        endDatetime: new Date('2026-06-01T12:00:00Z'),
        locationName: 'Test Location',
        status: 'draft',
      } as Event;

      eventRepo.findOne.mockResolvedValue(existingEvent);
      eventRepo.save.mockResolvedValue({
        ...existingEvent,
        title: 'New Title',
      } as Event);

      const result = await service.updateEvent(1, 1, { title: 'New Title' });

      expect(result.title).toBe('New Title');
    });

    it('should reject non-owner from updating event', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
        status: 'active',
      } as unknown as User);

      eventRepo.findOne.mockResolvedValue({
        id: 1,
        organizerId: 99,
        status: 'draft',
      } as Event);

      await expect(
        service.updateEvent(1, 1, { title: 'New Title' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
