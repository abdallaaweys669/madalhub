import type { EventCardModel } from '@/components/event/EventCard';
import { EVENT_FEED_BOXED_COVER_RATIO } from '@/components/event/feed/eventFeedTokens';

function formatTimeLabel(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatEventFeedPriceAmount(event: EventCardModel): string {
  const legacyPriceRaw = (event as { price?: unknown }).price;
  const legacyPrice =
    typeof legacyPriceRaw === 'number' && Number.isFinite(legacyPriceRaw) ? legacyPriceRaw : 0;
  const priceAmountNum =
    typeof event.priceAmount === 'number' && Number.isFinite(event.priceAmount)
      ? event.priceAmount
      : legacyPrice;
  const priceTypeLc = String(event.priceType || '').toLowerCase();
  const treatsAsPaid = priceTypeLc === 'paid' || priceAmountNum > 0;

  if (!treatsAsPaid) return 'Free';
  if (priceAmountNum > 0) {
    return `$${priceAmountNum.toFixed(priceAmountNum % 1 === 0 ? 0 : 2)}`;
  }
  return 'Paid';
}

export function isEventFeedPaid(event: EventCardModel): boolean {
  return formatEventFeedPriceAmount(event) !== 'Free';
}

export function formatCompactDateTimeLine(startsAt?: string | null): string {
  if (!startsAt) return '';
  const start = new Date(startsAt);
  if (!Number.isFinite(start.getTime())) return '';

  const shortDate = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const startTime = formatTimeLabel(startsAt);
  const compactTime = startTime?.replace(':00 ', ' ') ?? '';
  return compactTime ? `${shortDate} - ${compactTime}` : shortDate;
}

function titleCaseShort(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function cleanLocationLabel(raw: string): string {
  return raw
    .replace(/\b[2-9CFGHJMPQRVWX]{4,}\+[2-9CFGHJMPQRVWX]{2,}\b/gi, '')
    .replace(/\s+\d{4,6}\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function formatCompactLocationLine(
  event: EventCardModel & { city?: string | null; locationAddress?: string | null },
  locationPrimary?: string,
): string {
  if (event.isOnline) return 'Online';

  const venue = cleanLocationLabel(
    String(locationPrimary || event.locationName || '').trim(),
  );
  if (venue) return titleCaseShort(venue);

  const city = cleanLocationLabel(String(event.city || '').trim());
  if (city && city.toLowerCase() !== 'online') {
    return titleCaseShort(city);
  }

  const address = cleanLocationLabel(String(event.locationAddress || '').trim());
  if (address) {
    const firstPart = address.split(',')[0]?.trim();
    if (firstPart) return titleCaseShort(firstPart);
  }

  return 'Venue TBA';
}

/** Normalize explore/profile row shapes into EventCardModel for the feed card. */
export function toEventFeedCardModel(event: Record<string, unknown>): EventCardModel {
  const mode = event.mode === 'online' ? true : event.mode === 'in-person' ? false : undefined;
  const isOnline =
    typeof event.isOnline === 'boolean' ? event.isOnline : mode ?? false;

  const priceLabel = typeof event.priceLabel === 'string' ? event.priceLabel : null;
  let priceAmount = typeof event.priceAmount === 'number' ? event.priceAmount : null;
  if (priceAmount == null && priceLabel?.startsWith('$')) {
    const parsed = Number.parseFloat(priceLabel.replace('$', ''));
    if (Number.isFinite(parsed)) priceAmount = parsed;
  }

  return {
    id: String(event.id ?? ''),
    title: String(event.title ?? ''),
    details: String(event.details ?? event.location ?? ''),
    image: null,
    coverImageUrl:
      typeof event.coverImageUrl === 'string' ? event.coverImageUrl : null,
    coverLetter: typeof event.coverLetter === 'string' ? event.coverLetter : undefined,
    coverGradient: event.coverGradient as EventCardModel['coverGradient'],
    goingCount: typeof event.goingCount === 'number' ? event.goingCount : 0,
    attendeePreviews: Array.isArray(event.attendeePreviews)
      ? (event.attendeePreviews as EventCardModel['attendeePreviews'])
      : undefined,
    statusChip: event.statusChip as EventCardModel['statusChip'],
    urgencyLabel:
      typeof event.urgencyLabel === 'string' ? event.urgencyLabel : null,
    categoryName:
      typeof event.categoryName === 'string' ? event.categoryName : null,
    startsAt: typeof event.startsAt === 'string' ? event.startsAt : undefined,
    endsAt:
      typeof event.endsAt === 'string' || event.endsAt === null
        ? (event.endsAt as string | null)
        : undefined,
    isOnline,
    eventFormat:
      typeof event.eventFormat === 'string' || event.eventFormat === null
        ? (event.eventFormat as string | null)
        : undefined,
    locationName:
      typeof event.locationName === 'string' ? event.locationName : null,
    locationAddress:
      typeof event.locationAddress === 'string' ? event.locationAddress : null,
    priceType: (event.priceType as EventCardModel['priceType']) ?? 'Free',
    priceAmount,
    eventState: event.eventState as EventCardModel['eventState'],
    ...(typeof (event as { isJoined?: boolean }).isJoined === 'boolean'
      ? { isJoined: (event as { isJoined: boolean }).isJoined }
      : {}),
    ...(typeof event.city === 'string' ? { city: event.city } : {}),
  } as EventCardModel & { city?: string; isJoined?: boolean };
}

export function resolveFeedImageHeight(
  variant: 'boxed' | 'flat',
  width?: number,
): number | undefined {
  if (variant === 'flat') return undefined;
  const layoutWidth = width ?? 300;
  const innerWidth = layoutWidth - 24;
  return Math.round(innerWidth * EVENT_FEED_BOXED_COVER_RATIO);
}
