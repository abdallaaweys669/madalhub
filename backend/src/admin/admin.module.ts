import { Module } from '@nestjs/common';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './service/admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { OrganizerPaymentRequest } from 'src/database/entities/organizer-payment-request.entity';
import { OrganizerCreditRequest } from 'src/database/entities/organizer-credit-request.entity';
import { Event } from 'src/database/entities/event.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { Interest } from 'src/database/entities/interest.entity';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AdminReportsService } from './service/admin-reports.service';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      User,
      OrganizerProfile,
      OrganizerVerificationDocument,
      OrganizerPaymentRequest,
      OrganizerCreditRequest,
      Event,
      EventRegistration,
      Interest,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminReportsService],
})
export class AdminModule {}
