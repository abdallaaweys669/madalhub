import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetEventsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    const normalized = String(value).toLowerCase();
    return normalized === 'true' || normalized === '1';
  })
  @IsBoolean()
  joinedOnly?: boolean;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  interestId?: number;

  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(['online', 'in-person', 'any'])
  type?: 'online' | 'in-person' | 'any';

  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(['free', 'paid', 'any'])
  price?: 'free' | 'paid' | 'any';

  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn([
    'any',
    'meetup',
    'panel',
    'seminar',
    'workshop',
    'talk',
    'bootcamp',
    'conference',
    'summit',
    'hackathon',
  ])
  eventFormat?:
    | 'any'
    | 'meetup'
    | 'panel'
    | 'seminar'
    | 'workshop'
    | 'talk'
    | 'bootcamp'
    | 'conference'
    | 'summit'
    | 'hackathon';

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn([
    'upcoming',
    'today',
    'tomorrow',
    'this-weekend',
    'next-week',
    'this-month',
  ])
  dateBucket?:
    | 'upcoming'
    | 'today'
    | 'tomorrow'
    | 'this-weekend'
    | 'next-week'
    | 'this-month';

  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(['start-asc', 'start-desc', 'popular', 'trending'])
  sort?: 'start-asc' | 'start-desc' | 'popular' | 'trending';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizerId?: number;

  /** When filtering by organizerId: upcoming vs past by start time */
  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(['upcoming', 'past'])
  organizerScope?: 'upcoming' | 'past';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
