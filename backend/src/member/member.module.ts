import { Module } from '@nestjs/common';
import { MemberController } from './controllers/member.controller';
import { MemberService } from './services/member.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, MemberProfile])],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService], // Export the service so it can be used in other modules (like AuthModule)
})
export class MemberModule {}
