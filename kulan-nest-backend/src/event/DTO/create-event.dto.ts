import {
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';

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
}