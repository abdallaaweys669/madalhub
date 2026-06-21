import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { OrganizerNotification } from 'src/database/entities/organizer-notification.entity';

const ROLE_ORGANIZER = 2;

export type OrganizerNotificationType =
  | 'verification_approved'
  | 'verification_rejected'
  | 'payment_approved'
  | 'payment_rejected'
  | 'credits_granted'
  | 'event_registration';

export type OrganizerNotificationDto = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  eventId: number | null;
  actionRoute: string | null;
  readAt: string | null;
  createdAt: string;
};

@Injectable()
export class OrganizerNotificationsService {
  constructor(
    @InjectRepository(OrganizerNotification)
    private notificationRepo: Repository<OrganizerNotification>,
  ) {}

  private assertOrganizerRole(role?: number) {
    if (role != null && Number(role) !== ROLE_ORGANIZER) {
      throw new ForbiddenException(
        'Organizer notifications are available for organizers only',
      );
    }
  }

  private toDto(row: OrganizerNotification): OrganizerNotificationDto {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      eventId: row.eventId,
      actionRoute: row.actionRoute,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listForOrganizer(userId: number, role?: number) {
    this.assertOrganizerRole(role);

    const rows = await this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const unreadCount = rows.filter((row) => !row.readAt).length;

    return {
      items: rows.map((row) => this.toDto(row)),
      unreadCount,
    };
  }

  async getUnreadCount(userId: number, role?: number) {
    this.assertOrganizerRole(role);

    const unreadCount = await this.notificationRepo.count({
      where: { userId, readAt: IsNull() },
    });

    return { unreadCount };
  }

  async markRead(userId: number, notificationId: number, role?: number) {
    this.assertOrganizerRole(role);

    const row = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!row) {
      throw new NotFoundException('Notification not found');
    }

    if (!row.readAt) {
      row.readAt = new Date();
      await this.notificationRepo.save(row);
    }

    return this.toDto(row);
  }

  async markAllRead(userId: number, role?: number) {
    this.assertOrganizerRole(role);

    await this.notificationRepo
      .createQueryBuilder()
      .update(OrganizerNotification)
      .set({ readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();

    return { success: true };
  }

  async notifyVerificationApproved(userId: number) {
    return this.upsertByDedupeKey({
      userId,
      dedupeKey: 'verification_approved',
      type: 'verification_approved',
      title: 'Identity verified',
      body: 'Your organizer account is approved. Request publish credits from an admin to go live.',
      actionRoute: '/(organizer)/(tabs)/organization',
    });
  }

  async notifyVerificationRejected(userId: number, reason?: string | null) {
    return this.upsertByDedupeKey({
      userId,
      dedupeKey: `verification_rejected_${Date.now()}`,
      type: 'verification_rejected',
      title: 'Verification needs updates',
      body:
        reason?.trim() ||
        'Please update your documents and resubmit verification.',
      actionRoute: '/(organizer-status)/resubmit-verification',
    });
  }

  async notifyCreditsGranted(userId: number, creditsGranted: number) {
    return this.upsertByDedupeKey({
      userId,
      dedupeKey: `credits_granted_${Date.now()}`,
      type: 'credits_granted',
      title: 'Publish credits added',
      body: `${creditsGranted} publish credit${creditsGranted === 1 ? '' : 's'} added to your account. You can publish events now.`,
      actionRoute: '/(organizer)/(tabs)/events',
    });
  }

  async notifyPaymentApproved(userId: number, creditsGranted: number) {
    return this.notifyCreditsGranted(userId, creditsGranted);
  }

  async notifyPaymentRejected(userId: number, adminNote?: string | null) {
    return this.upsertByDedupeKey({
      userId,
      dedupeKey: `payment_rejected_${Date.now()}`,
      type: 'payment_rejected',
      title: 'Payment request declined',
      body:
        adminNote?.trim() ||
        'Your payment request was not approved. Contact support if you need help.',
      actionRoute: '/(organizer)/(tabs)/organization',
    });
  }

  async notifyEventRegistration(
    organizerId: number,
    eventId: number,
    eventTitle: string,
    registrationId: number,
  ) {
    return this.upsertByDedupeKey({
      userId: organizerId,
      dedupeKey: `event_registration_${registrationId}`,
      type: 'event_registration',
      title: `New registration: ${eventTitle}`,
      body: 'Someone just registered for your event.',
      eventId,
      actionRoute: `/events/${eventId}`,
    });
  }

  private async upsertByDedupeKey(input: {
    userId: number;
    dedupeKey: string;
    type: OrganizerNotificationType;
    title: string;
    body: string;
    eventId?: number;
    actionRoute?: string;
  }) {
    const existing = await this.notificationRepo.findOne({
      where: { userId: input.userId, dedupeKey: input.dedupeKey },
    });

    if (existing) {
      existing.title = input.title;
      existing.body = input.body;
      existing.type = input.type;
      existing.eventId = input.eventId ?? null;
      existing.actionRoute = input.actionRoute ?? null;
      existing.readAt = null;
      await this.notificationRepo.save(existing);
      return existing;
    }

    const created = this.notificationRepo.create({
      userId: input.userId,
      dedupeKey: input.dedupeKey,
      type: input.type,
      title: input.title,
      body: input.body,
      eventId: input.eventId ?? null,
      actionRoute: input.actionRoute ?? null,
      readAt: null,
      createdAt: new Date(),
    });

    return this.notificationRepo.save(created);
  }
}
