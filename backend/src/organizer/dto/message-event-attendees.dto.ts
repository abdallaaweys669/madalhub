import { IsInt, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class MessageEventAttendeesDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  body!: string;
}

export class CheckInEventAttendeeDto {
  @IsInt()
  memberId!: number;
}
