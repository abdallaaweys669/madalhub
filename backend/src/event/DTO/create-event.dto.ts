import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { EventSponsorInputDto } from './event-sponsor-input.dto';

export class EventRosterEntryDto {
  @IsNotEmpty()
  @IsString()
  role!: string;

  @IsNotEmpty()
  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;
}

export class CreateEventDto {
  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  description!: string;

  @IsNumber()
  interestId!: number;

  @IsBoolean()
  isPhysical!: boolean;

  @IsDateString()
  startDatetime!: Date;

  @IsDateString()
  endDatetime!: Date;

  locationName!: string;
  locationAddress!: string;

  @IsOptional()
  @IsNumber()
  locationLatitude?: number | null;

  @IsOptional()
  @IsNumber()
  locationLongitude?: number | null;

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

  @IsOptional()
  @IsString()
  eventFormat?: string | null;

  @IsOptional()
  @IsIn(['all', 'female', 'male'])
  audienceGender?: 'all' | 'female' | 'male';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventRosterEntryDto)
  roster?: EventRosterEntryDto[];

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsBoolean()
  isHybrid?: boolean;

  @IsOptional()
  @IsString()
  onlineLink?: string | null;
}
