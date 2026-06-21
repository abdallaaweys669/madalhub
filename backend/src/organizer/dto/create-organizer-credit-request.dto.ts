import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateOrganizerCreditRequestDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  eventId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  eventTitle?: string;
}
