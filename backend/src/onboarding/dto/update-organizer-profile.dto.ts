import { IsOptional, IsString } from 'class-validator';

export class UpdateOrganizerProfileDto {
  @IsOptional()
  @IsString()
  organization_name?: string;

  @IsOptional()
  @IsString()
  organization_description?: string;

  @IsOptional()
  @IsString()
  website?: string;
}
