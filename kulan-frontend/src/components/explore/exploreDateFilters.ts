export type ExploreDateFilter =
  | 'Any time'
  | 'Upcoming'
  | 'Today'
  | 'Tomorrow'
  | 'This weekend'
  | 'Next week'
  | 'This month';

export type ExploreDateApiBucket =
  | 'upcoming'
  | 'today'
  | 'tomorrow'
  | 'this-weekend'
  | 'next-week'
  | 'this-month';

export const DEFAULT_EXPLORE_DATE_FILTER: ExploreDateFilter = 'Any time';

export const EXPLORE_TIME_FILTER_OPTIONS: ReadonlyArray<{
  id: ExploreDateFilter;
  label: string;
}> = [
  { id: 'Any time', label: 'Any time' },
  { id: 'Upcoming', label: 'Upcoming' },
  { id: 'Today', label: 'Today' },
  { id: 'Tomorrow', label: 'Tomorrow' },
  { id: 'This weekend', label: 'This weekend' },
  { id: 'Next week', label: 'Next week' },
  { id: 'This month', label: 'This month' },
];

export function mapExploreDateToApiBucket(
  date: ExploreDateFilter,
): ExploreDateApiBucket | undefined {
  switch (date) {
    case 'Upcoming':
      return 'upcoming';
    case 'Today':
      return 'today';
    case 'Tomorrow':
      return 'tomorrow';
    case 'This weekend':
      return 'this-weekend';
    case 'Next week':
      return 'next-week';
    case 'This month':
      return 'this-month';
    default:
      return undefined;
  }
}
