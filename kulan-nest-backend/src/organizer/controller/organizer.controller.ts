import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateOrganizerDto } from '../dto/create-organizer.dto';
import { OrganizerService } from '../service/organizer.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

class OrganizerLoginDto {
  email!: string;
  password!: string;
}

@Controller('organizer')
export class OrganizerController {
  constructor(private service: OrganizerService) {}

  @Post('register')
  register(@Body() dto: CreateOrganizerDto) {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto: OrganizerLoginDto) {
    return this.service.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('status')
  getStatus(@Req() req: any) {
    return this.service.getStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('events')
  getMyEvents(@Req() req: any, @Query('status') status?: string) {
    return this.service.getMyEvents(req.user.userId, status);
  }
}
