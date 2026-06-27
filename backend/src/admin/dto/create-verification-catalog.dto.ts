import { IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateVerificationCatalogDto {
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'icon must be a lowercase Ionicons name (letters, numbers, hyphens)',
  })
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
