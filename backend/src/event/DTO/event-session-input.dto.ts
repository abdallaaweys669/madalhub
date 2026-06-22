import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class EventSessionInputDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  sessionFormat!: string;

  @IsDateString()
  startDatetime!: Date;

  @IsDateString()
  endDatetime!: Date;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  speakerNames?: string | null;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
