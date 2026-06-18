import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ClerkExchangeDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsOptional()
  @IsIn(['member', 'organizer'])
  role?: 'member' | 'organizer';

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
