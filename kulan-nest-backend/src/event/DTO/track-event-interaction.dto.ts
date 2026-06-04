import { IsIn, IsInt, Min } from 'class-validator';

const INTERACTION_ACTIONS = [
  'viewed',
  'opened',
  'shared',
  'saved',
  'registered',
] as const;

export class TrackEventInteractionDto {
  @IsInt()
  @Min(1)
  eventId!: number;

  @IsIn(INTERACTION_ACTIONS)
  action!: (typeof INTERACTION_ACTIONS)[number];
}
