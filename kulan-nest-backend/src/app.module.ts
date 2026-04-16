import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { OrganizerModule } from './organizer/organizer.module';
import { AdminModule } from './admin/admin.module';
import { EventModule } from './event/event.module';
import { OnboardingModule } from './onboarding/onboarding.module';


@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true, // 🔥 very important
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: +config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    

    MemberModule,

    

    AuthModule,

    

    OrganizerModule,

    

    AdminModule,

    

    EventModule,

    OnboardingModule,

    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
