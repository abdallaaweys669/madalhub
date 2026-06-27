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
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { getUploadsDir } from 'src/common/uploads-path';
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
import { UpdateMemberDto } from '../dto/update-member.dto';
import { SocialLoginDto } from '../dto/social-login.dto';
import { CreateOrganizerPaymentRequestDto } from '../dto/create-payment-request.dto';
import { CreateOrganizerCreditRequestDto } from '../dto/create-organizer-credit-request.dto';
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

  /** Public organizer summary for member apps. */
  @UseGuards(OptionalJwtAuthGuard)
  @Get('public/:organizerId')
  getPublicOrganizerProfile(
    @Param('organizerId', ParseIntPipe) organizerId: number,
  ) {
    return this.service.getPublicOrganizerProfile(organizerId);
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

  @Get('types')
  getOrganizerTypes() {
    return this.service.getOrganizerTypes();
  }

  @Get('verification-document-types')
  getVerificationDocumentTypes() {
    return this.service.getVerificationDocumentTypes();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('verification/check-phone')
  checkVerificationPhone(@CurrentUser() user: any, @Query('phone') phone?: string) {
    return this.service.isOrganizerPhoneAvailable(phone ?? '', user.userId).then((available) => ({
      available,
    }));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Post('verification/submit')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'document', maxCount: 1 },
        { name: 'profileImage', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: getUploadsDir(),
          filename: (req, file, cb) => {
            const ext = extname(file.originalname).toLowerCase();
            if (file.fieldname === 'document') {
              const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
              if (!allowedExts.includes(ext)) {
                return cb(new BadRequestException('Only PDF, JPG, PNG files are allowed'), '');
              }
              cb(null, `${Date.now()}-doc${ext}`);
              return;
            }
            const allowedImageExts = ['.jpg', '.jpeg', '.png'];
            if (!allowedImageExts.includes(ext)) {
              return cb(new BadRequestException('Profile image must be JPG or PNG'), '');
            }
            cb(null, `${Date.now()}-profile${ext}`);
          },
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
      },
    ),
  )
  submitVerification(
    @CurrentUser() user: any,
    @Body() body: {
      organizationName: string;
      organizerTypeId?: string;
      organizerTypeOther?: string;
      phone?: string;
      location?: string;
      website?: string;
      facebook?: string;
      instagram?: string;
      documentTypeSlug?: string;
      keepExistingDocument?: string;
    },
    @UploadedFiles()
    files?: {
      document?: Array<{ filename: string; size?: number }>;
      profileImage?: Array<{ filename: string; size?: number }>;
    },
  ) {
    const document = files?.document?.[0];
    const profileImage = files?.profileImage?.[0];

    if (profileImage?.size != null && profileImage.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Profile image must be under 5 MB.');
    }

    return this.service.submitVerification(user.userId, {
      organizationName: body.organizationName,
      organizerTypeId: body.organizerTypeId ? Number(body.organizerTypeId) : null,
      organizerTypeOther: body.organizerTypeOther || null,
      phone: body.phone || null,
      location: body.location || null,
      website: body.website || null,
      facebook: body.facebook || null,
      instagram: body.instagram || null,
      documentTypeSlug: body.documentTypeSlug || null,
      documentPath: document?.filename ?? null,
      keepExistingDocument: body.keepExistingDocument === '1',
      profileImagePath: profileImage?.filename ?? null,
    });
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
  @Roles(2)
  @Get('reports/:type')
  getOrganizerReport(
    @CurrentUser() user: any,
    @Param('type') type: string,
  ) {
    return this.service.getOrganizerReport(user.userId, type);
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
  @Post('credit-requests')
  requestPublishCredits(
    @CurrentUser() user: any,
    @Body() dto: CreateOrganizerCreditRequestDto,
  ) {
    return this.service.requestPublishCredits(user.userId, dto);
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
