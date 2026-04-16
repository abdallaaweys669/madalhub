import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from 'src/auth/DTO/login.dto';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MemberProfile)
    private profileRepository: Repository<MemberProfile>,
    private jwtService: JwtService,
  ) {}



  async getMe(userId: number) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  // remove password
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

  return safeUser;
}
async login(loginDto: LoginDto) {
  const user = await this.userRepository.findOne({
    where: { email: loginDto.email },
    select: ['id', 'roleId', 'password', 'status', 'email'],
  });

  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(
    loginDto.password,
    user.password,
  );

  if (!isMatch) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const payload = {
    sub: user.id,
    role: user.roleId,
    email: user.email,
    status: user.status,
  };

  const response: { access_token: string; profileCompleted?: boolean } = {
    access_token: this.jwtService.sign(payload),
  };

  if (user.roleId === 1) {
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    response.profileCompleted = profile?.profileCompleted ?? false;
  }

  return response;
}
}
