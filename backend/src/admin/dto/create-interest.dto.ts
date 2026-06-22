import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateInterestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'icon must be a lowercase Ionicons name (letters, numbers, hyphens)',
  })
  icon?: string;
}
