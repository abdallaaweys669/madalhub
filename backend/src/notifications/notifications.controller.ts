import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { userId: number; role?: number }) {
    return this.notificationsService.listForMember(user.userId, user.role);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: { userId: number; role?: number }) {
    return this.notificationsService.getUnreadCount(user.userId, user.role);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { userId: number; role?: number }) {
    return this.notificationsService.markAllRead(user.userId, user.role);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: { userId: number; role?: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markRead(user.userId, id, user.role);
  }
}
