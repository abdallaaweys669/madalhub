import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizerController } from './controller/organizer.controller';
import { OrganizerService } from './service/organizer.service';
import { User } from 'src/database/entities/user.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { OrganizerVerificationDocument } from 'src/database/entities/organizer-verification-document.entity';
import { OrganizerType } from 'src/database/entities/organizer-type.entity';
import { OrganizerVerificationDocumentType } from 'src/database/entities/organizer-verification-document-type.entity';
import { Event } from 'src/database/entities/event.entity';
import { EventRegistration } from 'src/database/entities/event-registration.entity';
import { OrganizerReview } from 'src/database/entities/organizer-review.entity';
import { OrganizerPaymentRequest } from 'src/database/entities/organizer-payment-request.entity';
import { OrganizerCreditRequest } from 'src/database/entities/organizer-credit-request.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      User,
      OrganizerProfile,
      OrganizerVerificationDocument,
      OrganizerType,
      OrganizerVerificationDocumentType,
      Event,
      EventRegistration,
      OrganizerReview,
      OrganizerPaymentRequest,
      OrganizerCreditRequest,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OrganizerController],
  providers: [OrganizerService],
  exports: [OrganizerService],
})
export class OrganizerModule {}
