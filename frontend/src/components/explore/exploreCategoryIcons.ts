import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type ExploreCategoryIconName = ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICON_MAP: Record<string, ExploreCategoryIconName> = {
  all: 'grid',
  gaming: 'game-controller',
  game: 'game-controller',
  arts: 'color-palette',
  art: 'color-palette',
  business: 'briefcase',
  fashion: 'shirt',
  sports: 'football',
  football: 'football',
  soccer: 'football',
  music: 'musical-notes',
  tech: 'hardware-chip',
  technology: 'hardware-chip',
  food: 'restaurant',
  travel: 'airplane',
  education: 'school',
  school: 'school',
  health: 'fitness',
  fitness: 'barbell',
  photography: 'camera',
  social: 'people',
  talk: 'mic',
  talks: 'mic',
  networking: 'people',
  outdoor: 'leaf',
  film: 'film',
  movies: 'film',
  dance: 'body',
  comedy: 'happy',
  science: 'flask',
  books: 'book',
  family: 'home',
  pets: 'paw',
  charity: 'heart',
  spirituality: 'sparkles',
};

const FALLBACK_ICONS: ExploreCategoryIconName[] = [
  'ticket',
  'star',
  'heart',
  'bulb',
  'planet',
  'ribbon',
  'megaphone',
];

export function toFilledCategoryIcon(icon: ExploreCategoryIconName): ExploreCategoryIconName {
  if (icon.endsWith('-outline')) {
    return icon.slice(0, -'-outline'.length) as ExploreCategoryIconName;
  }
  return icon;
}

export function resolveExploreCategoryIcon(
  name: string,
  fallbackIndex = 0,
): ExploreCategoryIconName {
  const key = String(name || '').trim().toLowerCase();
  if (!key) {
    return FALLBACK_ICONS[fallbackIndex % FALLBACK_ICONS.length];
  }

  const direct = CATEGORY_ICON_MAP[key];
  if (direct) return direct;

  const partial = Object.entries(CATEGORY_ICON_MAP).find(
    ([label]) => key.includes(label) || label.includes(key),
  );
  if (partial) return partial[1];

  return FALLBACK_ICONS[fallbackIndex % FALLBACK_ICONS.length];
}

/** Prefer admin-assigned icon from API; fall back to name heuristics. */
export function resolveInterestIcon(
  interest: { name?: string | null; icon?: string | null },
  fallbackIndex = 0,
): ExploreCategoryIconName {
  const stored = String(interest?.icon || '').trim().toLowerCase();
  if (stored) {
    return stored as ExploreCategoryIconName;
  }
  return resolveExploreCategoryIcon(String(interest?.name || ''), fallbackIndex);
}
