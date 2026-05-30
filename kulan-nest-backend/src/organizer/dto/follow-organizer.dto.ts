import { IsInt } from 'class-validator';

export class FollowOrganizerDto {
  @IsInt()
  organizerId!: number;
}
