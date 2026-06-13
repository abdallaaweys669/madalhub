import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { getUploadsDir } from 'src/common/uploads-path';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { CreateEventDto } from '../DTO/create-event.dto';
import { GetEventsQueryDto } from '../DTO/get-events-query.dto';
import { UpdateEventDto } from '../DTO/update-event.dto';
import { TrackEventInteractionDto } from '../DTO/track-event-interaction.dto';

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

  /** Upload cover or sponsor logo image; returns `{ path }` for use in create/update body as `coverImage` or sponsor `logo`. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Post('upload-cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: getUploadsDir(),
        filename: (_req, file, cb) => {
          cb(null, `event-${Date.now()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadEventCover(@UploadedFile() file: { filename: string } | undefined) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return { path: `/uploads/${file.filename}` };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Patch('publish/:id')
  publishEvent(@CurrentUser() user, @Param('id', ParseIntPipe) id: number) {
    return this.eventService.publishEvent(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Patch(':id')
  updateEvent(
    @CurrentUser() user,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.updateEvent(id, user.userId, dto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  getAllEvents(
    @CurrentUser() user?: { userId?: number; role?: number } | null,
    @Query() query?: GetEventsQueryDto,
  ) {
    const userId = user?.userId;
    return this.eventService.getAllEvents(userId, query, user?.role);
  }

  @Get('interests')
  getInterests() {
    return this.eventService.getInterests();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Get('saved/list')
  getSavedEvents(@CurrentUser() user) {
    return this.eventService.getSavedEvents(user.userId, user?.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Get('saved')
  getSavedEventsAlias(@CurrentUser() user) {
    return this.eventService.getSavedEvents(user.userId, user?.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Post('interactions')
  trackEventInteraction(@CurrentUser() user, @Body() dto: TrackEventInteractionDto) {
    return this.eventService.trackEventInteraction(user.userId, dto.eventId, dto.action);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Get('recommended')
  getRecommendedEvents(
    @CurrentUser() user,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 8;
    return this.eventService.getRecommendedEvents(
      user.userId,
      user?.role,
      Number.isFinite(parsedLimit) ? parsedLimit : 8,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/attendees')
  getEventAttendees(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: { userId?: number; role?: number } | null,
  ) {
    return this.eventService.getEventAttendees(
      id,
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
      user,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getEventById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: { userId?: number; role?: number } | null,
  ) {
    return this.eventService.getEventById(id, user?.userId, user?.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Post(':id/join')
  joinEvent(@CurrentUser() user, @Param('id', ParseIntPipe) id: number) {
    return this.eventService.joinEvent(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Post(':id/like')
  likeEvent(@CurrentUser() user, @Param('id', ParseIntPipe) id: number) {
    return this.eventService.likeEvent(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Delete(':id/like')
  unlikeEvent(@CurrentUser() user, @Param('id', ParseIntPipe) id: number) {
    return this.eventService.unlikeEvent(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Delete(':id/join')
  leaveEvent(@CurrentUser() user, @Param('id', ParseIntPipe) id: number) {
    return this.eventService.leaveEvent(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Post(':id/save')
  saveEvent(@CurrentUser() user, @Param('id', ParseIntPipe) id: number) {
    return this.eventService.saveEvent(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Delete(':id/save')
  unsaveEvent(@CurrentUser() user, @Param('id', ParseIntPipe) id: number) {
    return this.eventService.unsaveEvent(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Delete(':id')
  deleteEvent(@CurrentUser() user, @Param('id', ParseIntPipe) id: number) {
    return this.eventService.deleteEvent(id, user.userId);
  }
}
