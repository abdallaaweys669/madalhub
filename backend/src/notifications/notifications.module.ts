import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberNotification } from 'src/database/entities/member-notification.entity';
import { OrganizerNotification } from 'src/database/entities/organizer-notification.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { User } from 'src/database/entities/user.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { OrganizerNotificationsService } from './organizer-notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MemberNotification,
      OrganizerNotification,
      OrganizerProfile,
      User,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, OrganizerNotificationsService],
  exports: [NotificationsService, OrganizerNotificationsService],
})
export class NotificationsModule {}
