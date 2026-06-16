import { pickDisplayName } from '@/auth/normalizeUser';
import { formatEventDetailDateTime } from '@/utils/eventDisplay';
import { formatEventLocationDisplay } from '@/utils/eventLocation';
import {
  buildTicketDisplayId,
  buildTicketQrValue,
} from '@/utils/eventRegistration';

export function buildTicketMeta(event, user) {
  if (!event) return null;

  const memberName = pickDisplayName(user) || 'Member';
  const userId = user?.id ?? user?.sub ?? '';
  const { datePrimary, dateSecondary } = formatEventDetailDateTime(event.startsAt, event.endsAt);
  const location = formatEventLocationDisplay(event);
  const isOnline =
    event.isOnline === true ||
    String(event.locationName || '').trim().toLowerCase() === 'online';

  const timeLabel = dateSecondary?.includes('–')
    ? dateSecondary.split('–')[0].trim()
    : dateSecondary || '—';

  const shortDate = event.startsAt
    ? new Date(event.startsAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : datePrimary;

  const venueLabel = isOnline ? 'Online event' : location.venueLine || 'Venue TBA';

  return {
    dateLabel: shortDate || '—',
    timeLabel,
    venueLabel,
    guestLabel: memberName,
    isOnline,
    subtitle: `${timeLabel} · ${venueLabel}`,
    qrValue: buildTicketQrValue(event.id, userId),
    ticketId: buildTicketDisplayId(event.id, userId),
  };
}
