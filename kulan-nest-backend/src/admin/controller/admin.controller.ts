import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from '../service/admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

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
reject(@Param('id') id: number) {
  return this.adminService .rejectOrganizer(id);
}
}
