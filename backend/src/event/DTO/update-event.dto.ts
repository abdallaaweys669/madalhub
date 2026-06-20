import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateEventDto } from './create-event.dto';

/** PATCH body — all fields optional (matches mobile organizer saves). */
export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  @IsIn(['draft', 'published', 'cancelled'])
  status?: 'draft' | 'published' | 'cancelled';
}
