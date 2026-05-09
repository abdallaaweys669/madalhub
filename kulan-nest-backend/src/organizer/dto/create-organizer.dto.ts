import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateOrganizerDto {
  @IsNotEmpty()
  full_name!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsOptional()
  phone!: string;

  @IsOptional()
  location!: string;
}
