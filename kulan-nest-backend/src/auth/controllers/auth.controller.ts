import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { LoginDto } from 'src/auth/DTO/login.dto';
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
    // Delegates login logic to AuthService
    return this.authService.login(dto);
  }
}
