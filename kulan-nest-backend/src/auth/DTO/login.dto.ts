// src/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  // Validates that email has a proper format
  @IsEmail()
  email!: string;

  // Require password for login
  @IsNotEmpty()
  password!: string;
}
