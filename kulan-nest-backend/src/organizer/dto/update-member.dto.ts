import { IsOptional, IsEmail, MinLength } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  location?: string;
}