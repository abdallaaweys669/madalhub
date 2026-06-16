import { Alert, Linking, Platform, Share } from 'react-native';

function toGoogleCalendarDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function buildCalendarEventFields(event) {
  const start = toGoogleCalendarDate(event?.startsAt);
  if (!start) return null;

  let end = toGoogleCalendarDate(event?.endsAt);
  if (!end || end <= start) {
    const startDate = new Date(event.startsAt);
    const fallbackEnd = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    end = toGoogleCalendarDate(fallbackEnd.toISOString());
  }

  const details = [
    event?.description?.trim(),
    event?.id ? `Open in Kulan: kulanapp://events/${event.id}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    text: event?.title || 'Kulan Event',
    dates: `${start}/${end}`,
    details,
    location: [event?.locationName, event?.locationAddress, event?.city].filter(Boolean).join(', '),
  };
}

export function buildTicketQrValue(eventId, userId) {
  const eid = String(eventId || '').trim();
  const uid = String(userId || '').trim();
  return `kulanapp://events/${eid}?ticket=${uid}`;
}

/** Human-readable ticket ID shown on the pass (e.g. KUL-2026-A1B2-C3D4). */
export function buildTicketDisplayId(eventId, userId) {
  const year = new Date().getFullYear();
  const ePart = String(eventId ?? '')
    .replace(/\W/g, '')
    .slice(-4)
    .toUpperCase()
    .padStart(4, '0');
  const uPart = String(userId ?? '')
    .replace(/\W/g, '')
    .slice(-4)
    .toUpperCase()
    .padStart(4, '0');
  return `KUL-${year}-${ePart}-${uPart}`;
}

/** Opens in the Google Calendar app when installed (Android/iOS). */
export function buildGoogleCalendarAppUrl(event) {
  const fields = buildCalendarEventFields(event);
  if (!fields) return null;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: fields.text,
    dates: fields.dates,
    details: fields.details,
    location: fields.location,
  });

  return `https://www.google.com/calendar/event?${params.toString()}`;
}

/** Mobile-friendly web editor when the native app is unavailable. */
export function buildGoogleCalendarMobileWebUrl(event) {
  const fields = buildCalendarEventFields(event);
  if (!fields) return null;

  const params = new URLSearchParams({
    text: fields.text,
    dates: fields.dates,
    details: fields.details,
    location: fields.location,
  });

  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}

/** @deprecated Use buildGoogleCalendarAppUrl or buildGoogleCalendarMobileWebUrl. */
export function buildGoogleCalendarUrl(event) {
  return buildGoogleCalendarAppUrl(event);
}

function buildAndroidCalendarIntentUrl(appUrl, fallbackUrl) {
  const pathAndQuery = appUrl.replace(/^https:\/\//, '');
  return `intent://${pathAndQuery}#Intent;scheme=https;package=com.google.android.calendar;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
}

async function openCalendarUrl(url) {
  await Linking.openURL(url);
}

export async function addEventToCalendar(event) {
  const appUrl = buildGoogleCalendarAppUrl(event);
  const mobileWebUrl = buildGoogleCalendarMobileWebUrl(event);

  if (!appUrl || !mobileWebUrl) {
    Alert.alert('Calendar unavailable', 'This event does not have a valid start time yet.');
    return false;
  }

  try {
    if (Platform.OS === 'android') {
      const intentUrl = buildAndroidCalendarIntentUrl(appUrl, mobileWebUrl);
      try {
        await openCalendarUrl(intentUrl);
        return true;
      } catch {
        // Google Calendar app missing — fall through to mobile web UI.
      }
    }

    if (Platform.OS === 'ios') {
      try {
        await openCalendarUrl(appUrl);
        return true;
      } catch {
        // Fall through to mobile web UI.
      }
    }

    await openCalendarUrl(mobileWebUrl);
    return true;
  } catch {
    try {
      await openCalendarUrl(mobileWebUrl);
      return true;
    } catch {
      Alert.alert('Calendar unavailable', 'Please try again in a moment.');
      return false;
    }
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
