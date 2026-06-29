import { IsIn, IsOptional, IsString } from 'class-validator';

export const REPORT_SUMMARY_TYPES = [
  'members',
  'user-growth',
  'organizers',
  'events',
  'registrations',
  'attendance',
  'revenue',
  'verification',
  'popular-events',
  'audience',
  'location',
  'logs',
] as const;

export type ReportSummaryType = (typeof REPORT_SUMMARY_TYPES)[number];

export class AdminReportSummaryQueryDto {
  @IsIn([...REPORT_SUMMARY_TYPES])
  type!: ReportSummaryType;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  /** members report: all | male | female | not-set */
  @IsOptional()
  @IsString()
  gender?: string;
}
