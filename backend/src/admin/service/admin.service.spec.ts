import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { OrganizerPaymentRequest } from 'src/database/entities/organizer-payment-request.entity';
import { OrganizerCreditRequest } from 'src/database/entities/organizer-credit-request.entity';
import { Event } from 'src/database/entities/event.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { ConfigService } from '@nestjs/config';
import { OrganizerNotificationsService } from 'src/notifications/organizer-notifications.service';

describe('AdminService', () => {
  let service: AdminService;
  let userRepository: jest.Mocked<Repository<User>>;
  let organizerProfileRepository: jest.Mocked<Repository<OrganizerProfile>>;
  let organizerDocumentRepository: jest.Mocked<
    Repository<OrganizerVerificationDocument>
  >;
  let paymentRequestRepository: jest.Mocked<
    Repository<OrganizerPaymentRequest>
  >;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(OrganizerProfile), useFactory: mockRepo },
        {
          provide: getRepositoryToken(OrganizerVerificationDocument),
          useFactory: mockRepo,
        },
        {
          provide: getRepositoryToken(OrganizerPaymentRequest),
          useFactory: mockRepo,
        },
        {
          provide: getRepositoryToken(OrganizerCreditRequest),
          useFactory: mockRepo,
        },
        { provide: getRepositoryToken(Event), useFactory: mockRepo },
        { provide: getRepositoryToken(EventRegistration), useFactory: mockRepo },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PUBLISH_BUNDLE_CREDITS') return 5;
              return undefined;
            }),
          },
        },
        {
          provide: OrganizerNotificationsService,
          useValue: {
            notifyVerificationApproved: jest.fn().mockResolvedValue(undefined),
            notifyVerificationRejected: jest.fn().mockResolvedValue(undefined),
            notifyPaymentApproved: jest.fn().mockResolvedValue(undefined),
            notifyPaymentRejected: jest.fn().mockResolvedValue(undefined),
            notifyCreditsGranted: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepository = module.get(getRepositoryToken(User));
    organizerProfileRepository = module.get(
      getRepositoryToken(OrganizerProfile),
    );
    organizerDocumentRepository = module.get(
      getRepositoryToken(OrganizerVerificationDocument),
    );
    paymentRequestRepository = module.get(
      getRepositoryToken(OrganizerPaymentRequest),
    );
  });

  describe('rejectOrganizer', () => {
    it('should store rejection reason when provided', async () => {
      const mockUser = {
        id: 1,
        roleId: 2,
        status: 'pending',
      } as unknown as User;

      const mockProfile = {
        userId: 1,
        verificationStatus: 'pending',
        rejectionReason: null,
      } as OrganizerProfile;

      userRepository.findOne.mockResolvedValue(mockUser);
      organizerProfileRepository.findOne.mockResolvedValue(mockProfile);
      userRepository.save.mockResolvedValue(mockUser);
      organizerProfileRepository.save.mockResolvedValue({
        ...mockProfile,
        verificationStatus: 'rejected',
        rejectionReason: 'Documents were forged',
      });

      const result = await service.rejectOrganizer(1, 'Documents were forged');

      expect(organizerProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationStatus: 'rejected',
          rejectionReason: 'Documents were forged',
        }),
      );
      expect(result.rejectionReason).toBe('Documents were forged');
    });

    it('should reject organizer without reason (uses existing reason)', async () => {
      const mockUser = {
        id: 1,
        roleId: 2,
        status: 'pending',
      } as unknown as User;

      const mockProfile = {
        userId: 1,
        verificationStatus: 'pending',
        rejectionReason: 'Previous reason',
      } as OrganizerProfile;

      userRepository.findOne.mockResolvedValue(mockUser);
      organizerProfileRepository.findOne.mockResolvedValue(mockProfile);
      userRepository.save.mockResolvedValue(mockUser);
      organizerProfileRepository.save.mockResolvedValue({
        ...mockProfile,
        verificationStatus: 'rejected',
        rejectionReason: 'Previous reason',
      });

      const result = await service.rejectOrganizer(1);

      expect(result.rejectionReason).toBe('Previous reason');
    });

    it('should throw if organizer not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.rejectOrganizer(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if user is not an organizer', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        roleId: 1,
        status: 'active',
      } as unknown as User);

      await expect(service.rejectOrganizer(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approveOrganizer', () => {
    it('should approve organizer with complete profile and documents', async () => {
      const mockUser = {
        id: 1,
        roleId: 2,
        status: 'pending',
      } as unknown as User;

      const mockProfile = {
        userId: 1,
        verificationStatus: 'pending',
        organizationName: 'Test Org',
        organizationDescription: 'Test Desc',
      } as OrganizerProfile;

      userRepository.findOne.mockResolvedValue(mockUser);
      organizerProfileRepository.findOne.mockResolvedValue(mockProfile);
      organizerDocumentRepository.find.mockResolvedValue([
        { id: 1 },
      ] as OrganizerVerificationDocument[]);
      userRepository.save.mockResolvedValue({ ...mockUser, status: 'active' });
      organizerProfileRepository.save.mockResolvedValue({
        ...mockProfile,
        verificationStatus: 'approved',
      });

      const result = await service.approveOrganizer(1);

      expect(result.status).toBe('active');
    });

    it('should throw if profile is incomplete', async () => {
      const mockUser = {
        id: 1,
        roleId: 2,
        status: 'pending',
      } as unknown as User;

      const mockProfile = {
        userId: 1,
        verificationStatus: 'pending',
        organizationName: '',
        organizationDescription: '',
      } as OrganizerProfile;

      userRepository.findOne.mockResolvedValue(mockUser);
      organizerProfileRepository.findOne.mockResolvedValue(mockProfile);

      await expect(service.approveOrganizer(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPendingOrganizers', () => {
    it('should return pending organizers with profile and document info', async () => {
      organizerProfileRepository.find.mockResolvedValue([
        {
          userId: 1,
          verificationStatus: 'pending',
          organizationName: 'Test Org',
          organizationDescription: 'Test',
          website: 'https://test.com',
        },
      ] as OrganizerProfile[]);

      userRepository.findOne.mockResolvedValue({
        id: 1,
        roleId: 2,
        status: 'active',
        fullName: 'Org One',
        email: 'org1@test.com',
        phone: '',
      } as unknown as User);

      organizerDocumentRepository.findOne.mockResolvedValue({
        documentType: 'license',
        documentPath: '/uploads/doc.pdf',
        status: 'pending',
      } as OrganizerVerificationDocument);

      const result = await service.getPendingOrganizers();

      expect(result).toHaveLength(1);
      expect(result[0].profile).not.toBeNull();
      expect(result[0].document).not.toBeNull();
    });
  });

  describe('approvePaymentRequest', () => {
    it('grants bundle credits on approval', async () => {
      paymentRequestRepository.findOne.mockResolvedValue({
        id: 10,
        organizerId: 1,
        plan: 'bundle',
        status: 'pending',
      } as OrganizerPaymentRequest);

      organizerProfileRepository.findOne.mockResolvedValue({
        userId: 1,
        paidPublishCredits: 0,
      } as OrganizerProfile);

      organizerProfileRepository.save.mockResolvedValue({
        userId: 1,
        paidPublishCredits: 5,
      } as OrganizerProfile);

      paymentRequestRepository.save.mockResolvedValue({
        id: 10,
        status: 'approved',
        creditsGranted: 5,
      } as OrganizerPaymentRequest);

      const result = await service.approvePaymentRequest(10);

      expect(organizerProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ paidPublishCredits: 5 }),
      );
      expect(result.creditsGranted).toBe(5);
    });
  });
});
