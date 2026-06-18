import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrganizerPaymentRequestDto {
  @IsIn(['single', 'bundle'])
  plan!: 'single' | 'bundle';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
