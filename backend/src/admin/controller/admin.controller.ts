import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from '../service/admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RejectPaymentRequestDto } from '../dto/reject-payment-request.dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(3)
  @Get('organizers/pending')
  getPending() {
    return this.adminService.getPendingOrganizers();
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
  @Get('payment-requests/pending')
  getPendingPayments() {
    return this.adminService.getPendingPaymentRequests();
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
  rejectPayment(@Param('id') id: number, @Body() body: RejectPaymentRequestDto) {
    return this.adminService.rejectPaymentRequest(id, body?.adminNote);
  }
}
