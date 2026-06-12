import type { ExploreFilters } from '@/components/filters/FilterModal';

const DEFAULT_MODAL_FILTER_KEYS = {
  quickPick: null,
  type: 'Any',
  format: 'Any',
  price: 'Any',
  location: 'Anywhere',
  quickPickRule: null,
} as const;

export type ExploreActiveFilterChip = {
  key: 'quickPick' | 'type' | 'format' | 'price' | 'location';
  label: string;
};

function formatFormatLabel(format: ExploreFilters['format']) {
  if (format === 'Any') return '';
  return format.charAt(0).toUpperCase() + format.slice(1);
}

/** Modal filters only — date/time pills are separate on Explore. */
export function countExploreModalFilters(filters: ExploreFilters): number {
  let count = 0;
  if (filters.quickPick) count += 1;
  if (filters.type !== 'Any') count += 1;
  if (filters.format !== 'Any') count += 1;
  if (filters.price !== 'Any') count += 1;
  if (filters.location !== 'Anywhere') count += 1;
  return count;
}

export function getExploreActiveFilterChips(filters: ExploreFilters): ExploreActiveFilterChip[] {
  const chips: ExploreActiveFilterChip[] = [];

  if (filters.quickPick) {
    chips.push({ key: 'quickPick', label: filters.quickPick });
  }
  if (filters.location !== 'Anywhere') {
    chips.push({ key: 'location', label: filters.location });
  }
  if (filters.type !== 'Any') {
    chips.push({ key: 'type', label: filters.type });
  }
  if (filters.format !== 'Any') {
    const label = formatFormatLabel(filters.format);
    if (label) chips.push({ key: 'format', label });
  }
  if (filters.price !== 'Any') {
    chips.push({ key: 'price', label: filters.price });
  }

  return chips;
}

export function removeExploreModalFilterChip(
  filters: ExploreFilters,
  key: ExploreActiveFilterChip['key'],
): ExploreFilters {
  switch (key) {
    case 'quickPick':
      return { ...filters, quickPick: null, quickPickRule: null };
    case 'type':
      return { ...filters, type: 'Any' };
    case 'format':
      return { ...filters, format: 'Any' };
    case 'price':
      return { ...filters, price: 'Any' };
    case 'location':
      return { ...filters, location: 'Anywhere' };
    default:
      return filters;
  }
}

export function clearExploreModalFilters(filters: ExploreFilters): ExploreFilters {
  return {
    ...filters,
    ...DEFAULT_MODAL_FILTER_KEYS,
  };
}
