import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateOrganizerDto } from '../dto/create-organizer.dto';
import { OrganizerService } from '../service/organizer.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { FollowOrganizerDto } from '../dto/follow-organizer.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { SocialLoginDto } from '../dto/social-login.dto';
import { CreateOrganizerPaymentRequestDto } from '../dto/create-payment-request.dto';
import { OrganizerNotificationsService } from 'src/notifications/organizer-notifications.service';
import {
  CheckInEventAttendeeDto,
  MessageEventAttendeesDto,
} from '../dto/message-event-attendees.dto';

class OrganizerLoginDto {
  email!: string;
  password!: string;
}

@Controller('organizer')
export class OrganizerController {
  constructor(
    private service: OrganizerService,
    private organizerNotificationsService: OrganizerNotificationsService,
  ) {}

  @Post('register')
  register(@Body() dto: CreateOrganizerDto) {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto: OrganizerLoginDto) {
    return this.service.login(dto.email, dto.password);
  }

  /** Public organizer summary for member apps (optional JWT for isFollowing). */
  @UseGuards(OptionalJwtAuthGuard)
  @Get('public/:organizerId')
  getPublicOrganizerProfile(
    @Param('organizerId', ParseIntPipe) organizerId: number,
    @CurrentUser() user?: { userId: number; role: number },
  ) {
    return this.service.getPublicOrganizerProfile(organizerId, user);
  }

  @Post('social-login')
  socialLogin(@Body() dto: SocialLoginDto) {
    return this.service.socialLogin(dto);
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('profile-dashboard')
  getProfileDashboard(@CurrentUser() user: any) {
    return this.service.getProfileDashboard(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Patch('contact')
  updateContact(@CurrentUser() user: any, @Body() dto: UpdateMemberDto) {
    return this.service.updateContact(user.userId, {
      phone: dto.phone,
      location: dto.location,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Post('change-password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Post('follow')
  followOrganizer(@CurrentUser() user: any, @Body() dto: FollowOrganizerDto) {
    return this.service.followOrganizer(dto.organizerId, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Delete('follow/:organizerId')
  unfollowOrganizer(
    @CurrentUser() user: any,
    @Param('organizerId', ParseIntPipe) organizerId: number,
  ) {
    return this.service.unfollowOrganizer(organizerId, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('followers')
  getFollowers(@CurrentUser() user: any) {
    return this.service.getFollowers(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('attendees')
  getOrganizerAttendees(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.service.getOrganizerAttendees(user.userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      eventId: eventId ? Number(eventId) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('analytics')
  getOrganizerAnalytics(@CurrentUser() user: any) {
    return this.service.getOrganizerAnalytics(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Post('review')
  createReview(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.service.createReview(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Patch('review/:id')
  updateReview(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.service.updateReview(user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Delete('review/:id')
  deleteReview(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteReview(user.userId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('publish-eligibility')
  getPublishEligibility(@CurrentUser() user: any) {
    return this.service.getPublishEligibility(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('payment-config')
  getPaymentConfig() {
    return this.service.getPaymentConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Post('payment-requests')
  createPaymentRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateOrganizerPaymentRequestDto,
  ) {
    return this.service.createPaymentRequest(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('payment-requests')
  getMyPaymentRequests(@CurrentUser() user: any) {
    return this.service.getMyPaymentRequests(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('notifications')
  listNotifications(@CurrentUser() user: { userId: number; role?: number }) {
    return this.organizerNotificationsService.listForOrganizer(
      user.userId,
      user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('notifications/unread-count')
  notificationUnreadCount(
    @CurrentUser() user: { userId: number; role?: number },
  ) {
    return this.organizerNotificationsService.getUnreadCount(
      user.userId,
      user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Patch('notifications/read-all')
  markAllNotificationsRead(
    @CurrentUser() user: { userId: number; role?: number },
  ) {
    return this.organizerNotificationsService.markAllRead(
      user.userId,
      user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Patch('notifications/:id/read')
  markNotificationRead(
    @CurrentUser() user: { userId: number; role?: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.organizerNotificationsService.markRead(
      user.userId,
      id,
      user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('reviews/:organizerId')
  getOrganizerReviews(@Param('organizerId', ParseIntPipe) organizerId: number) {
    return this.service.getOrganizerReviews(organizerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Post('events/:eventId/message-attendees')
  messageEventAttendees(
    @CurrentUser() user: { userId: number },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: MessageEventAttendeesDto,
  ) {
    return this.service.messageEventAttendees(
      user.userId,
      eventId,
      dto.title,
      dto.body,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Post('events/:eventId/check-in')
  checkInEventAttendee(
    @CurrentUser() user: { userId: number },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: CheckInEventAttendeeDto,
  ) {
    return this.service.checkInEventAttendee(
      user.userId,
      eventId,
      dto.memberId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Post('events/:eventId/cancel')
  cancelEventAndNotify(
    @CurrentUser() user: { userId: number },
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.service.cancelEventAndNotify(user.userId, eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Post('events/:eventId/postpone-notify')
  notifyEventPostponed(
    @CurrentUser() user: { userId: number },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: { message?: string },
  ) {
    return this.service.notifyEventPostponed(
      user.userId,
      eventId,
      body?.message ?? '',
    );
  }
}
