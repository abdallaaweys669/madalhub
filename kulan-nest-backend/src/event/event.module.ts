import { Module } from '@nestjs/common';
import { EventController } from './controller/event.controller';
import { EventService } from './service/event.service';
import { Event } from 'src/database/entities/event.entity';
import { EventSponsor } from 'src/database/entities/event-sponsor.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { Interest } from 'src/database/entities/interest.entity';
import { SavedEvent } from 'src/database/entities/saved-event.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventSponsor,
      EventRegistration,
      User,
      OrganizerProfile,
      Interest,
      SavedEvent,
    ]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
