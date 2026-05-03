import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateMemberDto {
  @IsNotEmpty()
  full_name!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  phone!: string;
}
