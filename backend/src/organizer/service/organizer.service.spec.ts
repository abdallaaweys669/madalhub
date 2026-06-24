import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { OrganizerService } from './organizer.service';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { Event } from 'src/database/entities/event.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('OrganizerService', () => {
  let service: OrganizerService;
  let userRepository: jest.Mocked<Repository<User>>;
  let organizerProfileRepository: jest.Mocked<Repository<OrganizerProfile>>;
  let organizerDocumentRepository: jest.Mocked<
    Repository<OrganizerVerificationDocument>
  >;
  let eventRepository: jest.Mocked<Repository<Event>>;

  const mockUserRepo = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  });

  const mockOrgProfileRepo = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  });

  const mockOrgDocRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  });

  const mockEventRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  });

  const mockEventRegistrationRepo = () => ({
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizerService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        {
          provide: getRepositoryToken(OrganizerProfile),
          useFactory: mockOrgProfileRepo,
        },
        {
          provide: getRepositoryToken(OrganizerVerificationDocument),
          useFactory: mockOrgDocRepo,
        },
        { provide: getRepositoryToken(Event), useFactory: mockEventRepo },
        {
          provide: getRepositoryToken(EventRegistration),
          useFactory: mockEventRegistrationRepo,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-jwt-token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-secret') },
        },
      ],
    }).compile();

    service = module.get<OrganizerService>(OrganizerService);
    userRepository = module.get(getRepositoryToken(User));
    organizerProfileRepository = module.get(
      getRepositoryToken(OrganizerProfile),
    );
    organizerDocumentRepository = module.get(
      getRepositoryToken(OrganizerVerificationDocument),
    );
    eventRepository = module.get(getRepositoryToken(Event));
  });

  describe('login', () => {
    it('should return token and organizer status for valid organizer credentials', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'org@test.com',
        roleId: 2,
        status: 'pending',
        password: '$2b$12$hashed',
      } as unknown as User);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      organizerProfileRepository.findOne.mockResolvedValue({
        userId: 1,
        verificationStatus: 'pending',
        rejectionReason: null,
      } as OrganizerProfile);

      const result = await service.login('org@test.com', 'password123');

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.organizerStatus).toBe('pending');
      expect(result.rejectionReason).toBeNull();
    });

    it('should reject non-organizer role login attempts', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'member@test.com',
        roleId: 1,
        status: 'active',
        password: '$2b$12$hashed',
      } as unknown as User);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await expect(
        service.login('member@test.com', 'password123'),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    });

    it('should throw on invalid password', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'org@test.com',
        roleId: 2,
        status: 'pending',
        password: '$2b$12$hashed',
      } as unknown as User);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        service.login('org@test.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getStatus', () => {
    it('should return organizer status for pending organizer', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'org@test.com',
        roleId: 2,
        status: 'pending',
        fullName: 'Test Org',
      } as unknown as User);

      organizerProfileRepository.findOne.mockResolvedValue({
        userId: 1,
        verificationStatus: 'pending',
        rejectionReason: null,
        organizationName: 'Test Organization',
      } as OrganizerProfile);

      organizerDocumentRepository.findOne.mockResolvedValue(null);

      const result = await service.getStatus(1);

      expect(result.verificationStatus).toBe('pending');
      expect(result.rejectionReason).toBeNull();
    });

    it('should return rejection reason for rejected organizer', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'org@test.com',
        roleId: 2,
        status: 'rejected',
        fullName: 'Test Org',
      } as unknown as User);

      organizerProfileRepository.findOne.mockResolvedValue({
        userId: 1,
        verificationStatus: 'rejected',
        rejectionReason: 'Invalid document submitted',
        organizationName: 'Test Organization',
      } as OrganizerProfile);

      organizerDocumentRepository.findOne.mockResolvedValue({
        id: 1,
        status: 'rejected',
      } as OrganizerVerificationDocument);

      const result = await service.getStatus(1);

      expect(result.verificationStatus).toBe('rejected');
      expect(result.rejectionReason).toBe('Invalid document submitted');
    });

    it('should throw for non-organizer user', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        roleId: 1,
        status: 'active',
      } as unknown as User);

      await expect(service.getStatus(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyEvents - owner scoping', () => {
    it('should return only events owned by the organizer', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
      } as unknown as User);

      eventRepository.find.mockResolvedValue([
        {
          id: 10,
          title: 'My Event',
          organizerId: 1,
          status: 'draft',
          startDatetime: new Date(),
          endDatetime: new Date(),
          locationName: 'Location',
          capacity: 100,
          totalPrice: 0,
          isPhysical: true,
          description: 'Desc',
          createdAt: new Date(),
        },
      ] as Event[]);

      const result = await service.getMyEvents(1);

      expect(eventRepository.find).toHaveBeenCalledWith({
        where: { organizerId: 1 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('My Event');
      expect(result[0].registrationCount).toBe(0);
    });

    it('should filter by status when provided', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
      } as unknown as User);

      eventRepository.find.mockResolvedValue([]);

      await service.getMyEvents(1, 'published');

      expect(eventRepository.find).toHaveBeenCalledWith({
        where: { organizerId: 1, status: 'published' },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
