import { IsEmail, IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;

  @IsIn(['signup', 'login'])
  purpose!: 'signup' | 'login';
}
