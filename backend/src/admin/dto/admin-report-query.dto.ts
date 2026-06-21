import { IsIn, IsOptional, IsString } from 'class-validator';

export class AdminReportQueryDto {
  @IsIn(['members', 'organizers', 'events', 'registrations', 'revenue'])
  type!: 'members' | 'organizers' | 'events' | 'registrations' | 'revenue';

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
