import { formatEventLocationDisplay } from '@/utils/eventLocation';

function formatTimeLabel(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

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

  const datePrimary = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const startTime = formatTimeLabel(startsAt);
  const endTime = formatTimeLabel(endsAt);
  const dateSecondary =
    startTime && endTime && startTime !== endTime ? `${startTime} – ${endTime}` : startTime || endTime || '';

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
