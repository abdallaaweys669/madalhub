import { Alert, Linking, Platform } from 'react-native';

/** Digits only — WhatsApp expects country code without + or spaces. */
export function normalizeWhatsAppPhone(phone: string | null | undefined): string {
  return String(phone ?? '').replace(/[^\d]/g, '');
}

function firstName(fullName: string | null | undefined): string {
  const trimmed = String(fullName ?? '').trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0] || 'there';
}

/** Pre-filled intro when a member contacts another member from a Kulan profile. */
export function buildKulanMemberWhatsAppMessage(options: {
  memberName?: string | null;
  visitorName?: string | null;
} = {}): string {
  const memberFirst = firstName(options.memberName);
  const visitor = String(options.visitorName ?? '').trim() || 'A Kulan member';

  return (
    `Hi ${memberFirst}! I'm ${visitor}.\n\n` +
    `I'm reaching out from Kulan after viewing your member profile. ` +
    `I'd like to connect about an event we're both interested in.`
  );
}

export function buildKulanMemberWhatsAppUrl(
  phone: string | null | undefined,
  options: {
    memberName?: string | null;
    visitorName?: string | null;
  } = {},
): string | null {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return null;

  const text = buildKulanMemberWhatsAppMessage(options);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export async function openKulanMemberWhatsApp(
  phone: string | null | undefined,
  options: {
    memberName?: string | null;
    visitorName?: string | null;
  } = {},
): Promise<boolean> {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) {
    Alert.alert('Cannot message', 'This member does not have a valid phone number for WhatsApp.');
    return false;
  }

  const text = buildKulanMemberWhatsAppMessage(options);
  const encodedText = encodeURIComponent(text);
  const candidates = [
    `whatsapp://send?phone=${digits}&text=${encodedText}`,
    `https://wa.me/${digits}?text=${encodedText}`,
  ];

  for (const url of candidates) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      /* try next scheme */
    }
  }

  if (Platform.OS === 'web') {
    try {
      await Linking.openURL(candidates[1]!);
      return true;
    } catch {
      /* fall through */
    }
  }

  Alert.alert(
    'WhatsApp unavailable',
    'Could not open WhatsApp. Make sure it is installed, then try again.',
  );
  return false;
}
