import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { EmailOtp } from 'src/database/entities/email-otp.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import type { StringValue } from 'ms';
import { EmailModule } from 'src/email/email.module';
import { OtpService } from './services/otp.service';
import { MemberModule } from 'src/member/member.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, MemberProfile, OrganizerProfile, EmailOtp]),
    MemberModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN');

        if (!secret || !expiresIn) {
          throw new Error('JWT config missing in .env');
        }

        const normalizedExpiresIn = /^\d+$/.test(expiresIn)
          ? Number(expiresIn)
          : (expiresIn as StringValue);

        return {
          secret,
          signOptions: {
            expiresIn: normalizedExpiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, JwtStrategy],
})
export class AuthModule {}
