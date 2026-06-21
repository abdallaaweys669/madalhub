import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  /** Organizers list: `with-events` | `no-events` */
  @IsOptional()
  @IsString()
  activity?: string;

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
