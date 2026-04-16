import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateEventDto } from '../DTO/create-event.dto';

import { EventService } from '../service/event.service';                

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Post()
  createEvent(@CurrentUser() user, @Body() dto: CreateEventDto) {
    return this.eventService.createEvent(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Patch('publish/:id')
  publishEvent(
    @CurrentUser() user,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventService.publishEvent(id, user.userId);
  }

  @Get()
  getAllEvents() {
    return this.eventService.getAllEvents();
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getEventById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ) {
    return this.eventService.getEventById(id, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Post(':id/join')
  joinEvent(
    @CurrentUser() user,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventService.joinEvent(id, user.userId);
  }
}
