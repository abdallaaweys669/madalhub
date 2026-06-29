import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  /** Organizers: `with-events` | `no-events`. Members: `with-registrations` | `no-registrations`. */
  @IsOptional()
  @IsString()
  activity?: string;

  /** Members list: all | male | female | not-set */
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  joinedFrom?: string;

  @IsOptional()
  @IsString()
  joinedTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  eventId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  memberId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
