import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { EventSponsorInputDto } from './event-sponsor-input.dto';

export class CreateEventDto {
  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  description!: string;

  @IsNumber()
  interestId!: number;

  @IsBoolean()
  isPhysical!: boolean;

  @IsDateString() // 🔥 better
  startDatetime!: Date;

  @IsDateString() // 🔥 better
  endDatetime!: Date;

  locationName!: string;
  locationAddress!: string;

  @IsNumber()
  totalPrice!: number;

  @IsNumber()
  capacity!: number;

  @IsOptional()
  @IsString()
  coverImage?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventSponsorInputDto)
  sponsors?: EventSponsorInputDto[];
}
