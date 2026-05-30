import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OnboardingService } from './onboarding.service';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';
import { MemberInterest } from 'src/database/entities/member-interest.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save'>>;
  let organizerProfileRepository: jest.Mocked<
    Pick<Repository<OrganizerProfile>, 'findOne' | 'save'>
  >;
  let organizerDocumentRepository: jest.Mocked<
    Pick<
      Repository<OrganizerVerificationDocument>,
      'find' | 'save' | 'create' | 'query'
    >
  >;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    organizerProfileRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    organizerDocumentRepository = {
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(MemberProfile),
          useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() },
        },
        {
          provide: getRepositoryToken(MemberInterest),
          useValue: { delete: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(OrganizerProfile),
          useValue: organizerProfileRepository,
        },
        {
          provide: getRepositoryToken(OrganizerVerificationDocument),
          useValue: organizerDocumentRepository,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  describe('upsertOrganizerDocument', () => {
    const userId = 42;
    const mockFile = { filename: 'doc.jpg' };

    beforeEach(() => {
      organizerDocumentRepository.query.mockResolvedValue([
        { Type: 'varchar(50)' },
      ]);
    });

    it('sets profile and user back to pending after resubmit when previously rejected (update existing doc)', async () => {
      const existingDoc = {
        id: 1,
        organizerId: userId,
        documentType: 'business_license',
        documentPath: '/uploads/old.jpg',
        status: 'rejected',
        uploadedAt: new Date(),
      };

      organizerDocumentRepository.find.mockResolvedValue([existingDoc as any]);
      organizerDocumentRepository.save.mockImplementation((e) =>
        Promise.resolve(e as any),
      );

      const rejectedProfile = {
        userId,
        organizationName: 'Org',
        verificationStatus: 'rejected',
        rejectionReason: 'Bad scan',
      } as OrganizerProfile;

      organizerProfileRepository.findOne.mockResolvedValue(rejectedProfile);
      organizerProfileRepository.save.mockImplementation((p) =>
        Promise.resolve(p as any),
      );

      const rejectedUser = {
        id: userId,
        roleId: 2,
        status: 'rejected',
      } as User;
      userRepository.findOne.mockResolvedValue(rejectedUser);
      userRepository.save.mockImplementation((u) => Promise.resolve(u as any));

      await service.upsertOrganizerDocument(
        userId,
        mockFile,
        'business_license',
      );

      expect(organizerProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationStatus: 'pending',
          rejectionReason: null,
        }),
      );
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
        }),
      );
    });

    it('sets profile and user back to pending when creating first doc after rejection state', async () => {
      organizerDocumentRepository.find.mockResolvedValue([]);

      const newDoc = {
        id: 2,
        organizerId: userId,
        documentType: 'business_license',
        documentPath: '/uploads/doc.jpg',
        status: 'pending',
        uploadedAt: new Date(),
      };

      organizerDocumentRepository.create.mockReturnValue(newDoc as any);
      organizerDocumentRepository.save.mockResolvedValue(newDoc as any);

      const rejectedProfile = {
        userId,
        organizationName: 'Org',
        verificationStatus: 'rejected',
        rejectionReason: 'Incomplete',
      } as OrganizerProfile;

      organizerProfileRepository.findOne.mockResolvedValue(rejectedProfile);
      organizerProfileRepository.save.mockImplementation((p) =>
        Promise.resolve(p as any),
      );

      userRepository.findOne.mockResolvedValue({
        id: userId,
        roleId: 2,
        status: 'rejected',
      } as User);
      userRepository.save.mockImplementation((u) => Promise.resolve(u as any));

      await service.upsertOrganizerDocument(
        userId,
        mockFile,
        'business_license',
      );

      expect(organizerProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationStatus: 'pending',
          rejectionReason: null,
        }),
      );
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });

    it('does not change profile when verification was already pending', async () => {
      const existingDoc = {
        id: 1,
        organizerId: userId,
        documentType: 'business_license',
        documentPath: '/uploads/old.jpg',
        status: 'pending',
        uploadedAt: new Date(),
      };

      organizerDocumentRepository.find.mockResolvedValue([existingDoc as any]);
      organizerDocumentRepository.save.mockImplementation((e) =>
        Promise.resolve(e as any),
      );

      organizerProfileRepository.findOne.mockResolvedValue({
        userId,
        verificationStatus: 'pending',
      } as OrganizerProfile);

      await service.upsertOrganizerDocument(
        userId,
        mockFile,
        'business_license',
      );

      expect(organizerProfileRepository.save).not.toHaveBeenCalled();
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws when multiple documents exist', async () => {
      organizerDocumentRepository.find.mockResolvedValue([{}, {}] as any);

      await expect(
        service.upsertOrganizerDocument(userId, mockFile, 'business_license'),
      ).rejects.toThrow(BadRequestException);

      expect(organizerDocumentRepository.save).not.toHaveBeenCalled();
    });
  });
});
