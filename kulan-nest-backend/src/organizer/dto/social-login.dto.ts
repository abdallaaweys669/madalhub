import { IsIn, IsOptional, IsString } from 'class-validator';

export class SocialLoginDto {
  @IsIn(['google', 'facebook'])
  provider!: 'google' | 'facebook';

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
