import { Module } from '@nestjs/common';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './service/admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      OrganizerProfile,
      OrganizerVerificationDocument,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
