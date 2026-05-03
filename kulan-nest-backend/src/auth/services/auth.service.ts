import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from 'src/auth/DTO/login.dto';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MemberProfile)
    private profileRepository: Repository<MemberProfile>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    private jwtService: JwtService,
  ) {}

  async getMe(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...safeUser } = user;

    if (user.roleId === 1) {
      const profile = await this.profileRepository.findOne({
        where: { userId },
      });

      return {
        ...safeUser,
        profileCompleted: profile?.profileCompleted ?? false,
      };
    }

    if (user.roleId === 2) {
      const organizerProfile = await this.organizerProfileRepository.findOne({
        where: { userId },
      });

      return {
        ...safeUser,
        organizerStatus: organizerProfile?.verificationStatus ?? 'pending',
        rejectionReason: organizerProfile?.rejectionReason ?? null,
      };
    }

    return safeUser;
  }
  async login(loginDto: LoginDto) {
    const emailNorm = (loginDto.email ?? '').trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: emailNorm },
      select: ['id', 'roleId', 'password', 'status', 'email'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.roleId === 2) {
      throw new UnauthorizedException('Use organizer login from the Welcome screen.');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      role: user.roleId,
      email: user.email,
      status: user.status,
    };

    const response: {
      access_token: string;
      profileCompleted?: boolean;
      organizerStatus?: string;
      rejectionReason?: string | null;
    } = {
      access_token: this.jwtService.sign(payload),
    };

    if (user.roleId === 1) {
      const profile = await this.profileRepository.findOne({
        where: { userId: user.id },
      });

      response.profileCompleted = profile?.profileCompleted ?? false;
    }

    if (user.roleId === 2) {
      const organizerProfile = await this.organizerProfileRepository.findOne({
        where: { userId: user.id },
      });

      response.organizerStatus =
        organizerProfile?.verificationStatus ?? 'pending';
      response.rejectionReason = organizerProfile?.rejectionReason ?? null;
    }

    return response;
  }
}
