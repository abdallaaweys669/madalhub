import { Module } from '@nestjs/common';
import { OrganizerController } from './controller/organizer.controller';
import { OrganizerService } from './service/organizer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';

@Module({
   imports: [
    TypeOrmModule.forFeature([User, OrganizerProfile]),
  ],
  controllers: [OrganizerController],
  providers: [OrganizerService]
})
export class OrganizerModule {}
