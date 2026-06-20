import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizerNotificationsService } from './organizer-notifications.service';
import { OrganizerNotification } from 'src/database/entities/organizer-notification.entity';

describe('OrganizerNotificationsService', () => {
  let service: OrganizerNotificationsService;
  let repo: jest.Mocked<Repository<OrganizerNotification>>;

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
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(OrganizerNotificationsService);
    repo = module.get(getRepositoryToken(OrganizerNotification));
  });

  it('lists notifications for organizer', async () => {
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

  it('creates payment approved notification', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((input) => input as OrganizerNotification);
    repo.save.mockImplementation(
      async (input) => ({ id: 5, ...input }) as OrganizerNotification,
    );

    await service.notifyPaymentApproved(2, 1);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2,
        type: 'payment_approved',
      }),
    );
  });
});
