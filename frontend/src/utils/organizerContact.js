import { Alert, Linking } from 'react-native';

function firstName(fullName) {
  const trimmed = String(fullName ?? '').trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0] || 'there';
}

export function buildOrganizerContactEmailUrl(
  email,
  { organizerName, visitorName } = {},
) {
  const trimmed = String(email ?? '').trim();
  if (!trimmed || !trimmed.includes('@')) return null;

  const organizerFirst = firstName(organizerName);
  const visitor = String(visitorName ?? '').trim() || 'A MadalHub member';
  const subject = `MadalHub — Message for ${String(organizerName ?? 'organizer').trim() || 'organizer'}`;
  const body =
    `Hi ${organizerFirst},\n\n` +
    `I'm ${visitor} reaching out from MadalHub after viewing your organizer profile. ` +
    `I'd like to connect about your events.\n\n`;

  const params = new URLSearchParams({
    subject,
    body,
  });

  return `mailto:${trimmed}?${params.toString()}`;
}

export async function openOrganizerContactEmail(
  email,
  { organizerName, visitorName } = {},
) {
  const url = buildOrganizerContactEmailUrl(email, { organizerName, visitorName });
  if (!url) {
    Alert.alert('Cannot email', 'This organizer does not have a contact email available.');
    return false;
  }

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('Could not open email', 'Try again later or copy their email manually.');
    return false;
  }
}
