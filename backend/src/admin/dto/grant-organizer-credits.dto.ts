import { IsInt, Min } from 'class-validator';

export class GrantOrganizerCreditsDto {
  @IsInt()
  @Min(1)
  credits!: number;
}
