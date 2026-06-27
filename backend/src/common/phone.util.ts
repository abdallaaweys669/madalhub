/** Digits only — used to compare phones regardless of formatting. */
export function normalizePhoneDigits(phone: string | null | undefined): string {
  return String(phone ?? '').replace(/\D/g, '');
}

/** Canonical storage format: +{country}{national} (digits only after +). */
export function formatPhoneE164(phone: string | null | undefined): string {
  const digits = normalizePhoneDigits(phone);
  return digits ? `+${digits}` : '';
}
