import { IsIn } from 'class-validator';

export class UpdateEventStatusDto {
  @IsIn(['draft', 'published', 'cancelled'])
  status!: string;
}
