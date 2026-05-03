import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateOrganizerDto {
  @IsNotEmpty()
  full_name!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  phone!: string;

  @IsNotEmpty()
  location!: string;
}
