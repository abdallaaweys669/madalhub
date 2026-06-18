import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPaymentRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
