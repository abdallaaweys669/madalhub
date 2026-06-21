import { IsIn } from 'class-validator';

export class UpdateAccountStatusDto {
  @IsIn(['active', 'pending', 'rejected'])
  status!: string;
}
