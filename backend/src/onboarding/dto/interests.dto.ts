import { IsArray, IsInt } from 'class-validator';

export class InterestsDto {
  @IsArray()
  @IsInt({ each: true })
  interestIds!: number[];
}
