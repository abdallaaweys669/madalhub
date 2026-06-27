import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizerNotificationsService } from './organizer-notifications.service';
import { OrganizerNotification } from 'src/database/entities/organizer-notification.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';

describe('OrganizerNotificationsService', () => {
  let service: OrganizerNotificationsService;
  let repo: jest.Mocked<Repository<OrganizerNotification>>;
  let profileRepo: jest.Mocked<Repository<OrganizerProfile>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizerNotificationsService,
        {
          provide: getRepositoryToken(OrganizerNotification),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrganizerProfile),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(OrganizerNotificationsService);
    repo = module.get(getRepositoryToken(OrganizerNotification));
    profileRepo = module.get(getRepositoryToken(OrganizerProfile));
  });

  it('lists notifications for organizer', async () => {
    profileRepo.findOne.mockResolvedValue({
      verificationStatus: 'approved',
    } as OrganizerProfile);

    repo.find.mockResolvedValue([
      {
        id: 1,
        userId: 2,
        type: 'payment_approved',
        title: 'Payment approved',
        body: '1 publish credit added.',
        eventId: null,
        actionRoute: '/(organizer)/(tabs)/organization',
        dedupeKey: 'payment_approved_1',
        readAt: null,
        createdAt: new Date('2026-06-01T10:00:00Z'),
      },
    ] as OrganizerNotification[]);

    const result = await service.listForOrganizer(2, 2);

    expect(result.items).toHaveLength(1);
    expect(result.unreadCount).toBe(1);
  });

  it('hides stale verification rejection notifications after approval', async () => {
    profileRepo.findOne.mockResolvedValue({
      verificationStatus: 'approved',
    } as OrganizerProfile);

    repo.find.mockResolvedValue([
      {
        id: 1,
        userId: 2,
        type: 'verification_approved',
        title: 'Identity verified',
        body: 'Approved',
        eventId: null,
        actionRoute: '/(organizer)/(tabs)/organization',
        dedupeKey: 'verification_approved',
        readAt: null,
        createdAt: new Date('2026-06-02T10:00:00Z'),
      },
      {
        id: 2,
        userId: 2,
        type: 'verification_rejected',
        title: 'Verification needs updates',
        body: 'Old rejection',
        eventId: null,
        actionRoute: '/(organizer-status)/resubmit-verification',
        dedupeKey: 'verification_rejected_1',
        readAt: null,
        createdAt: new Date('2026-06-01T10:00:00Z'),
      },
    ] as OrganizerNotification[]);

    const result = await service.listForOrganizer(2, 2);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe('verification_approved');
    expect(result.unreadCount).toBe(1);
  });

  it('creates credits granted notification', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((input) => input as OrganizerNotification);
    repo.save.mockImplementation(
      async (input) => ({ id: 5, ...input }) as OrganizerNotification,
    );

    await service.notifyCreditsGranted(2, 1);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2,
        type: 'credits_granted',
      }),
    );
  });
});
