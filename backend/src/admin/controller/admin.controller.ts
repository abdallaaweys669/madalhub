import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from '../service/admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RejectPaymentRequestDto } from '../dto/reject-payment-request.dto';
import { GrantOrganizerCreditsDto } from '../dto/grant-organizer-credits.dto';
import { AdminListQueryDto } from '../dto/admin-list-query.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { AdminReportQueryDto } from '../dto/admin-report-query.dto';
import { UpdateAccountStatusDto } from '../dto/update-account-status.dto';
import { UpdateEventStatusDto } from '../dto/update-event-status.dto';
import { AdminReportSummaryQueryDto } from '../dto/admin-report-summary-query.dto';
import { AdminReportsService } from '../service/admin-reports.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateInterestDto } from '../dto/create-interest.dto';
import { UpdateInterestDto } from '../dto/update-interest.dto';
import { CreateVerificationCatalogDto } from '../dto/create-verification-catalog.dto';
import { UpdateVerificationCatalogDto } from '../dto/update-verification-catalog.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private adminReportsService: AdminReportsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('reports/summary')
  getReportSummary(@Query() query: AdminReportSummaryQueryDto) {
    return this.adminReportsService.getSummary(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('reports')
  getReport(@Query() query: AdminReportQueryDto) {
    return this.adminService.getReport(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('members/:id')
  getMember(@Param('id') id: number) {
    return this.adminService.getMemberDetail(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('members/:id/status')
  updateMemberStatus(
    @Param('id') id: number,
    @Body() body: UpdateAccountStatusDto,
  ) {
    return this.adminService.updateMemberStatus(id, body.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('members')
  listMembers(@Query() query: AdminListQueryDto) {
    return this.adminService.listMembers(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('organizers/pending')
  getPending() {
    return this.adminService.getPendingOrganizers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('organizers/:id')
  getOrganizer(@Param('id') id: number) {
    return this.adminService.getOrganizerDetail(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('organizers')
  listOrganizers(@Query() query: AdminListQueryDto) {
    return this.adminService.listOrganizers(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('organizers/approve/:id')
  approve(@Param('id') id: number) {
    return this.adminService.approveOrganizer(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('organizers/reject/:id')
  reject(@Param('id') id: number, @Body() body?: { reason?: string }) {
    return this.adminService.rejectOrganizer(id, body?.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('events/:id')
  getEvent(@Param('id') id: number) {
    return this.adminService.getEventDetail(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('events/:id/status')
  updateEventStatus(
    @Param('id') id: number,
    @Body() body: UpdateEventStatusDto,
  ) {
    return this.adminService.updateEventStatus(id, body.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('events')
  listEvents(@Query() query: AdminListQueryDto) {
    return this.adminService.listEvents(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('registrations')
  listRegistrations(@Query() query: AdminListQueryDto) {
    return this.adminService.listRegistrations(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('credit-requests/pending')
  getPendingCreditRequests() {
    return this.adminService.getPendingCreditRequests();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('credit-requests/:id/grant')
  grantCreditRequest(
    @Param('id') id: number,
    @Body() body: GrantOrganizerCreditsDto,
  ) {
    return this.adminService.grantCreditRequest(id, body.credits);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('credit-requests/:id/dismiss')
  dismissCreditRequest(@Param('id') id: number) {
    return this.adminService.dismissCreditRequest(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('organizers/:id/status')
  updateOrganizerStatus(
    @Param('id') id: number,
    @Body() body: UpdateAccountStatusDto,
  ) {
    return this.adminService.updateOrganizerStatus(id, body.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('organizers/:id/credits')
  grantOrganizerCredits(
    @Param('id') id: number,
    @Body() body: GrantOrganizerCreditsDto,
  ) {
    return this.adminService.grantOrganizerCredits(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('payment-requests/pending')
  getPendingPayments() {
    return this.adminService.getPendingPaymentRequests();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('payment-requests')
  listPaymentRequests(@Query() query: AdminListQueryDto) {
    return this.adminService.listPaymentRequests(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('payment-requests/:id/approve')
  approvePayment(@Param('id') id: number) {
    return this.adminService.approvePaymentRequest(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('payment-requests/:id/reject')
  rejectPayment(
    @Param('id') id: number,
    @Body() body: RejectPaymentRequestDto,
  ) {
    return this.adminService.rejectPaymentRequest(id, body?.adminNote);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('admins')
  listAdmins(@Query() query: AdminListQueryDto) {
    return this.adminService.listAdmins(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('admins/:id')
  updateAdmin(
    @Param('id') id: number,
    @Body() dto: UpdateAdminDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.adminService.updateAdmin(id, dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('interests')
  listInterests() {
    return this.adminService.listInterests();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Post('interests')
  createInterest(@Body() dto: CreateInterestDto) {
    return this.adminService.createInterest(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('interests/:id')
  updateInterest(@Param('id') id: number, @Body() dto: UpdateInterestDto) {
    return this.adminService.updateInterest(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Delete('interests/:id')
  deleteInterest(@Param('id') id: number) {
    return this.adminService.deleteInterest(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('organizer-types')
  listOrganizerTypes() {
    return this.adminService.listOrganizerTypes();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Post('organizer-types')
  createOrganizerType(@Body() dto: CreateVerificationCatalogDto) {
    return this.adminService.createOrganizerType(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('organizer-types/:id')
  updateOrganizerType(@Param('id') id: number, @Body() dto: UpdateVerificationCatalogDto) {
    return this.adminService.updateOrganizerType(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Delete('organizer-types/:id')
  deleteOrganizerType(@Param('id') id: number) {
    return this.adminService.deleteOrganizerType(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('verification-document-types')
  listVerificationDocumentTypes() {
    return this.adminService.listVerificationDocumentTypes();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Post('verification-document-types')
  createVerificationDocumentType(@Body() dto: CreateVerificationCatalogDto) {
    return this.adminService.createVerificationDocumentType(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Patch('verification-document-types/:id')
  updateVerificationDocumentType(
    @Param('id') id: number,
    @Body() dto: UpdateVerificationCatalogDto,
  ) {
    return this.adminService.updateVerificationDocumentType(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Delete('verification-document-types/:id')
  deleteVerificationDocumentType(@Param('id') id: number) {
    return this.adminService.deleteVerificationDocumentType(id);
  }
}
