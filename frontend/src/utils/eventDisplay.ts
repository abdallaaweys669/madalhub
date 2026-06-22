import { formatEventLocationDisplay } from '@/utils/eventLocation';
import { formatEventDateLabel, formatEventTimeLabel } from '@/utils/formatEventSchedule';

export type EventScheduleLocationInput = {
  startsAt?: string | null;
  endsAt?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  city?: string | null;
  isOnline?: boolean;
  mapAreaLine?: string | null;
};

export function buildEventScheduleLocationFields(input: EventScheduleLocationInput) {
  const { datePrimary, dateSecondary } = formatEventDetailDateTime(input.startsAt, input.endsAt);
  const { venueLine, areaLine } = formatEventLocationDisplay(input);

  return {
    datePrimary,
    dateSecondary,
    locationPrimary: venueLine,
    locationSecondary: areaLine,
  };
}

export function formatEventDetailDateTime(startsAt?: string | null, endsAt?: string | null) {
  if (!startsAt) {
    return { datePrimary: '', dateSecondary: '' };
  }
  const start = new Date(startsAt);
  if (!Number.isFinite(start.getTime())) {
    return { datePrimary: '', dateSecondary: '' };
  }

  const end = endsAt ? new Date(endsAt) : null;
  const datePrimary = formatEventDateLabel(start, end);
  const dateSecondary = formatEventTimeLabel(start, end);

  return { datePrimary, dateSecondary };
}

export function toDisplayTitle(title?: string | null) {
  const trimmed = String(title || '').trim();
  if (!trimmed) return '';
  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= 4 && letters === letters.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .split(/\s+/)
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(' ');
  }
  return trimmed;
}
