import { Body, Controller,Post } from '@nestjs/common';
import { CreateOrganizerDto } from '../dto/create-organizer.dto';
import { OrganizerService } from '../service/organizer.service';

@Controller('organizer')
export class OrganizerController {
  constructor(private service: OrganizerService) {}

  @Post('register')
  register(@Body() dto: CreateOrganizerDto) {
    return this.service.register(dto);
  }
}
