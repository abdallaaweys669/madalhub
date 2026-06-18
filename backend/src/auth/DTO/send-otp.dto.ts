import { IsEmail, IsIn, IsNotEmpty } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  email!: string;

  @IsIn(['signup', 'login'])
  purpose!: 'signup' | 'login';
}
