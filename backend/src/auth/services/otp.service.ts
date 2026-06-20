import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { MoreThan, Repository } from 'typeorm';
import { EmailService } from 'src/email/email.service';
import {
  EmailOtp,
  type EmailOtpPurpose,
} from 'src/database/entities/email-otp.entity';
import { User } from 'src/database/entities/user.entity';

const MEMBER_ROLE_ID = 1;

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(EmailOtp)
    private readonly otpRepository: Repository<EmailOtp>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private normalizeEmail(email: string): string {
    return (email ?? '').trim().toLowerCase();
  }

  private getExpiresMinutes(): number {
    return Number(this.configService.get('OTP_EXPIRES_MINUTES') ?? 10);
  }

  private getResendCooldownSeconds(): number {
    return Number(this.configService.get('OTP_RESEND_COOLDOWN_SECONDS') ?? 60);
  }

  private getMaxAttempts(): number {
    return Number(this.configService.get('OTP_MAX_ATTEMPTS') ?? 5);
  }

  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendOtp(
    rawEmail: string,
    purpose: EmailOtpPurpose,
  ): Promise<{ message: string }> {
    const email = this.normalizeEmail(rawEmail);
    const user = await this.userRepository.findOne({ where: { email } });

    if (purpose === 'signup') {
      if (user) {
        throw new BadRequestException('Email already exists');
      }
    } else if (purpose === 'login') {
      if (!user || user.roleId !== MEMBER_ROLE_ID) {
        return {
          message:
            'If an account exists for this email, a verification code was sent.',
        };
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSendCount = await this.otpRepository.count({
      where: {
        email,
        purpose,
        lastSentAt: MoreThan(oneHourAgo),
      },
    });

    if (recentSendCount >= 5) {
      throw new HttpException(
        'Too many code requests. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const existing = await this.otpRepository.findOne({
      where: { email, purpose },
      order: { id: 'DESC' },
    });

    if (existing) {
      const cooldownMs = this.getResendCooldownSeconds() * 1000;
      const elapsed = Date.now() - existing.lastSentAt.getTime();
      if (elapsed < cooldownMs) {
        const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
        throw new HttpException(
          `Please wait ${waitSeconds}s before requesting a new code.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.getExpiresMinutes() * 60 * 1000,
    );

    await this.otpRepository.delete({ email, purpose });

    await this.otpRepository.save(
      this.otpRepository.create({
        email,
        purpose,
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        createdAt: now,
      }),
    );

    if (purpose === 'login' && (!user || user.roleId !== MEMBER_ROLE_ID)) {
      return {
        message:
          'If an account exists for this email, a verification code was sent.',
      };
    }

    await this.emailService.sendOtpEmail(email, code);

    return {
      message:
        purpose === 'signup'
          ? 'Verification code sent to your email.'
          : 'If an account exists for this email, a verification code was sent.',
    };
  }

  async verifyOtpCode(
    rawEmail: string,
    code: string,
    purpose: EmailOtpPurpose,
  ): Promise<void> {
    const email = this.normalizeEmail(rawEmail);
    const otp = await this.otpRepository.findOne({
      where: { email, purpose },
      order: { id: 'DESC' },
    });

    if (!otp) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      await this.otpRepository.delete({ id: otp.id });
      throw new UnauthorizedException(
        'Verification code expired. Request a new one.',
      );
    }

    if (otp.attempts >= this.getMaxAttempts()) {
      throw new HttpException(
        'Too many failed attempts. Request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const matches = await bcrypt.compare(code, otp.codeHash);
    if (!matches) {
      otp.attempts += 1;
      await this.otpRepository.save(otp);
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.otpRepository.delete({ id: otp.id });
  }
}
