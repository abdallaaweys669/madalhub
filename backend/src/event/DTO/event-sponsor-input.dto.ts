import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EventSponsorInputDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  logo?: string;
}
