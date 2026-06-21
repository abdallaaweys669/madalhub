import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsIn(['active', 'pending', 'rejected'])
  status?: string;
}
