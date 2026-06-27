import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { ClerkExchangeDto } from 'src/auth/DTO/clerk-exchange.dto';
import { LoginDto } from 'src/auth/DTO/login.dto';
import { VerifyOtpSignupDto } from 'src/auth/DTO/verify-otp-signup.dto';
import { User } from 'src/database/entities/user.entity';
import { MemberProfile } from 'src/database/entities/member-profile.entity';
import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpService } from './otp.service';
import { MemberService } from 'src/member/services/member.service';

const MEMBER_ROLE_ID = 1;
const ADMIN_ROLE_ID = 3;

/** Roles allowed to sign in with email + password on POST /auth/login */
const PASSWORD_LOGIN_ROLE_IDS = new Set([MEMBER_ROLE_ID, ADMIN_ROLE_ID]);

export type AuthTokenResponse = {
  access_token: string;
  profileCompleted?: boolean;
  organizerStatus?: string;
  rejectionReason?: string | null;
};

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
    private configService: ConfigService,
    private otpService: OtpService,
    private memberService: MemberService,
  ) {}

  async getMe(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...safeUser } = user;

    const locationPlain =
      safeUser.location != null && String(safeUser.location).trim() !== ''
        ? String(safeUser.location).trim()
        : '';

    if (user.roleId === 1) {
      const profile = await this.profileRepository.findOne({
        where: { userId },
      });

      return {
        ...safeUser,
        location: locationPlain,
        profileCompleted: profile?.profileCompleted ?? false,
      };
    }

    if (user.roleId === 2) {
      const organizerProfile = await this.organizerProfileRepository.findOne({
        where: { userId },
      });

      return {
        ...safeUser,
        location: locationPlain,
        organizerStatus: organizerProfile?.verificationStatus ?? 'pending',
        rejectionReason: organizerProfile?.rejectionReason ?? null,
      };
    }

    return {
      ...safeUser,
      location: locationPlain,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthTokenResponse> {
    const emailNorm = (loginDto.email ?? '').trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: emailNorm },
      select: ['id', 'roleId', 'password', 'status', 'email'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);

    if (!isMatch || !PASSWORD_LOGIN_ROLE_IDS.has(user.roleId)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokenForUser(user.id);
  }

  async sendOtp(email: string, purpose: 'signup' | 'login') {
    return this.otpService.sendOtp(email, purpose);
  }

  async verifyOtpLogin(
    email: string,
    code: string,
  ): Promise<AuthTokenResponse> {
    const emailNorm = (email ?? '').trim().toLowerCase();
    await this.otpService.verifyOtpCode(emailNorm, code, 'login');

    const user = await this.userRepository.findOne({
      where: { email: emailNorm },
    });

    if (!user || user.roleId !== 1) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    if (!user.emailVerifiedAt) {
      await this.userRepository.update(user.id, {
        emailVerifiedAt: new Date(),
      });
    }

    return this.issueTokenForUser(user.id);
  }

  async verifyOtpSignup(dto: VerifyOtpSignupDto): Promise<AuthTokenResponse> {
    const emailNorm = (dto.email ?? '').trim().toLowerCase();
    await this.otpService.verifyOtpCode(emailNorm, dto.code, 'signup');

    const existing = await this.userRepository.findOne({
      where: { email: emailNorm },
    });

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const savedUser = await this.memberService.register({
      full_name: dto.full_name,
      email: emailNorm,
      password: dto.password,
      phone: dto.phone,
    });

    await this.userRepository.update(savedUser.id, {
      emailVerifiedAt: new Date(),
    });

    return this.issueTokenForUser(savedUser.id);
  }

  async clerkExchange(dto: ClerkExchangeDto): Promise<AuthTokenResponse> {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      throw new UnauthorizedException(
        'Clerk is not configured on this server.',
      );
    }

    const clerk = createClerkClient({ secretKey });

    let clerkUserId: string;
    try {
      const payload = await verifyToken(dto.token, { secretKey });
      clerkUserId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired Clerk token.');
    }

    const clerkUser = await clerk.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new UnauthorizedException(
        'No email associated with this Clerk account.',
      );
    }

    const emailNorm = email.trim().toLowerCase();
    let user = await this.userRepository.findOne({
      where: { email: emailNorm },
    });

    if (!user) {
      const fullName =
        dto.fullName?.trim() ||
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
        'User';

      const savedUser = await this.memberService.register({
        full_name: fullName,
        email: emailNorm,
        password: dto.password || `clerk_${clerkUserId}`,
        phone: '',
      });

      await this.userRepository.update(savedUser.id, {
        emailVerifiedAt: new Date(),
      });

      user = await this.userRepository.findOne({
        where: { id: (savedUser as any).id },
      });
      if (!user) throw new UnauthorizedException('User creation failed.');
    } else if (!user.emailVerifiedAt) {
      await this.userRepository.update(user.id, {
        emailVerifiedAt: new Date(),
      });
    }

    return this.issueTokenForUser(user.id);
  }

  private async issueTokenForUser(userId: number): Promise<AuthTokenResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'roleId', 'status', 'email'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      sub: user.id,
      role: user.roleId,
      email: user.email,
      status: user.status,
    };

    const response: AuthTokenResponse = {
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
