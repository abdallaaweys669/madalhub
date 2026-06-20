import {
  IsOptional,
  IsEmail,
  MinLength,
  IsBoolean,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const toBool = (value: unknown) => {
  if (value === true || value === 1 || value === '1' || value === 'true')
    return true;
  if (value === false || value === 0 || value === '0' || value === 'false')
    return false;
  return value;
};

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

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  profile_show_email?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  profile_show_phone?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  profile_hidden?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  social_website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  social_linkedin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  social_instagram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  social_facebook?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  social_tiktok?: string;
}
