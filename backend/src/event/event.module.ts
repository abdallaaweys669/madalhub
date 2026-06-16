import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './controller/event.controller';
import { EventService } from './service/event.service';
import { Event } from 'src/database/entities/event.entity';
import { EventSponsor } from 'src/database/entities/event-sponsor.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { Interest } from 'src/database/entities/interest.entity';
import { SavedEvent } from 'src/database/entities/saved-event.entity';
import { EventProgramRoster } from 'src/database/entities/event-program-roster.entity';
import { EventCohost } from 'src/database/entities/event-cohost.entity';
import { EventLike } from 'src/database/entities/event-like.entity';
import { MemberInterest } from 'src/database/entities/member-interest.entity';
import { MemberEventInteraction } from 'src/database/entities/member-event-interaction.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      Event,
      EventSponsor,
      EventRegistration,
      User,
      OrganizerProfile,
      Interest,
      SavedEvent,
      EventProgramRoster,
      EventCohost,
      EventLike,
      MemberInterest,
      MemberEventInteraction,
    ]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
