import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClerkExchangeDto } from 'src/auth/DTO/clerk-exchange.dto';
import { LoginDto } from 'src/auth/DTO/login.dto';
import { SendOtpDto } from 'src/auth/DTO/send-otp.dto';
import { VerifyOtpDto } from 'src/auth/DTO/verify-otp.dto';
import { VerifyOtpSignupDto } from 'src/auth/DTO/verify-otp-signup.dto';
import { AuthService } from 'src/auth/services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user) {
    return this.authService.getMe(user.userId);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('otp/send')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.email, dto.purpose);
  }

  @Post('otp/verify')
  verifyOtpLogin(@Body() dto: VerifyOtpDto) {
    if (dto.purpose !== 'login') {
      throw new BadRequestException(
        'Use /auth/otp/verify-signup for signup verification.',
      );
    }
    return this.authService.verifyOtpLogin(dto.email, dto.code);
  }

  @Post('otp/verify-signup')
  verifyOtpSignup(@Body() dto: VerifyOtpSignupDto) {
    return this.authService.verifyOtpSignup(dto);
  }

  @Post('clerk-exchange')
  clerkExchange(@Body() dto: ClerkExchangeDto) {
    return this.authService.clerkExchange(dto);
  }
}
