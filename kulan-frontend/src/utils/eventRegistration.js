import { Alert, Linking, Platform, Share } from 'react-native';

function toGoogleCalendarDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildTicketQrValue(eventId, userId) {
  const eid = String(eventId || '').trim();
  const uid = String(userId || '').trim();
  return `kulanapp://events/${eid}?ticket=${uid}`;
}

export function buildGoogleCalendarUrl(event) {
  const start = toGoogleCalendarDate(event?.startsAt);
  if (!start) return null;

  const endRaw = event?.endsAt ? toGoogleCalendarDate(event.endsAt) : null;
  const end = endRaw || start;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event?.title || 'Kulan Event',
    dates: `${start}/${end}`,
    details: event?.description || '',
    location: [event?.locationName, event?.locationAddress, event?.city].filter(Boolean).join(', '),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function addEventToCalendar(event) {
  const url = buildGoogleCalendarUrl(event);
  if (!url) {
    Alert.alert('Calendar unavailable', 'This event does not have a valid start time yet.');
    return false;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Calendar unavailable', 'Could not open your calendar app.');
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('Calendar unavailable', 'Please try again in a moment.');
    return false;
  }
}

export async function shareEventRegistration(event, memberName) {
  const when = event?.details || event?.startsAt || '';
  const where =
    event?.isOnline || String(event?.locationName || '').toLowerCase() === 'online'
      ? 'Online'
      : [event?.locationName, event?.city].filter(Boolean).join(', ');

  const message = [
    `I'm going to ${event?.title || 'an event'} on Kulan!`,
    when ? `When: ${when}` : '',
    where ? `Where: ${where}` : '',
    memberName ? `— ${memberName}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await Share.share({
      message,
      title: event?.title || 'Kulan Event',
      ...(Platform.OS === 'ios' ? { url: `kulanapp://events/${event?.id}` } : {}),
    });
    return true;
  } catch {
    return false;
  }
}
