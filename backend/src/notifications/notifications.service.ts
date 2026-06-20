import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MemberNotification } from 'src/database/entities/member-notification.entity';
import { User } from 'src/database/entities/user.entity';

const ROLE_MEMBER = 1;

export type MemberNotificationType =
  | 'profile_complete'
  | 'event_joined'
  | 'event_saved'
  | 'organizer_message'
  | 'event_cancelled'
  | 'event_postponed';

export type MemberNotificationDto = {
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
export class NotificationsService {
  constructor(
    @InjectRepository(MemberNotification)
    private notificationRepo: Repository<MemberNotification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private assertMemberRole(role?: number) {
    if (role != null && Number(role) !== ROLE_MEMBER) {
      throw new ForbiddenException(
        'Notifications are available for members only',
      );
    }
  }

  private toDto(row: MemberNotification): MemberNotificationDto {
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

  async listForMember(userId: number, role?: number) {
    this.assertMemberRole(role);
    await this.syncProfileNudges(userId);

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
    this.assertMemberRole(role);
    await this.syncProfileNudges(userId);

    const unreadCount = await this.notificationRepo.count({
      where: { userId, readAt: IsNull() },
    });

    return { unreadCount };
  }

  async markRead(userId: number, notificationId: number, role?: number) {
    this.assertMemberRole(role);

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
    this.assertMemberRole(role);

    await this.notificationRepo
      .createQueryBuilder()
      .update(MemberNotification)
      .set({ readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();

    return { success: true };
  }

  async syncProfileNudges(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const phone = String(user.phone ?? '').trim();
    const dedupeKey = 'profile_complete_phone';

    if (phone) {
      await this.notificationRepo.delete({ userId, dedupeKey });
      return;
    }

    await this.upsertByDedupeKey({
      userId,
      dedupeKey,
      type: 'profile_complete',
      title: 'Complete your profile',
      body: 'Add your phone number so organizers and members can reach you.',
      actionRoute: '/(modal)/editProfile',
    });
  }

  async notifyEventJoined(userId: number, eventId: number, eventTitle: string) {
    await this.upsertByDedupeKey({
      userId,
      dedupeKey: `event_joined_${eventId}`,
      type: 'event_joined',
      title: `You're going to ${eventTitle}`,
      body: 'Your spot is confirmed. View event details and ticket info.',
      eventId,
      actionRoute: `/events/${eventId}`,
    });
  }

  async notifyEventSaved(userId: number, eventId: number, eventTitle: string) {
    await this.upsertByDedupeKey({
      userId,
      dedupeKey: `event_saved_${eventId}`,
      type: 'event_saved',
      title: `Saved: ${eventTitle}`,
      body: 'We added this event to your saved list.',
      eventId,
      actionRoute: `/events/${eventId}`,
    });
  }

  async createMemberNotification(input: {
    userId: number;
    dedupeKey: string;
    type: string;
    title: string;
    body: string;
    eventId?: number;
    actionRoute?: string;
  }) {
    return this.upsertByDedupeKey({
      userId: input.userId,
      dedupeKey: input.dedupeKey,
      type: input.type as MemberNotificationType,
      title: input.title,
      body: input.body,
      eventId: input.eventId,
      actionRoute: input.actionRoute,
    });
  }

  async notifyOrganizerBlast(
    userId: number,
    eventId: number,
    title: string,
    body: string,
  ) {
    return this.createMemberNotification({
      userId,
      dedupeKey: `organizer_blast_${eventId}_${Date.now()}_${userId}`,
      type: 'organizer_message',
      title,
      body,
      eventId,
      actionRoute: `/events/${eventId}`,
    });
  }

  async notifyEventCancelled(userId: number, eventId: number, eventTitle: string) {
    return this.createMemberNotification({
      userId,
      dedupeKey: `event_cancelled_${eventId}_${userId}`,
      type: 'event_cancelled',
      title: `${eventTitle} was cancelled`,
      body: 'The organizer cancelled this event. You will not be charged for any ticket.',
      eventId,
      actionRoute: `/events/${eventId}`,
    });
  }

  async notifyEventPostponed(
    userId: number,
    eventId: number,
    eventTitle: string,
    body: string,
  ) {
    return this.createMemberNotification({
      userId,
      dedupeKey: `event_postponed_${eventId}_${Date.now()}_${userId}`,
      type: 'event_postponed',
      title: `${eventTitle} was postponed`,
      body,
      eventId,
      actionRoute: `/events/${eventId}`,
    });
  }

  private async upsertByDedupeKey(input: {
    userId: number;
    dedupeKey: string;
    type: MemberNotificationType;
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
