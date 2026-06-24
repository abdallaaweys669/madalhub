/** Parse member ticket QR: madalhub://events/{eventId}?ticket={memberId} */
export function parseTicketQrValue(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const deepLink = trimmed.match(/madalhub:\/\/events\/(\d+)\?ticket=(\d+)/i);
  if (deepLink) {
    return { eventId: Number(deepLink[1]), memberId: Number(deepLink[2]) };
  }
  try {
    const parsed = JSON.parse(trimmed);
    const eventId = Number(parsed?.eventId ?? parsed?.event_id);
    const memberId = Number(parsed?.memberId ?? parsed?.member_id ?? parsed?.ticket);
    if (Number.isFinite(eventId) && Number.isFinite(memberId)) {
      return { eventId, memberId };
    }
  } catch {
    // not JSON
  }
  try {
    const url = new URL(trimmed.replace(/^madalhub:\/\//, 'https://'));
    const eventId = Number(url.pathname.split('/').filter(Boolean).pop());
    const memberId = Number(url.searchParams.get('ticket'));
    if (Number.isFinite(eventId) && Number.isFinite(memberId)) {
      return { eventId, memberId };
    }
  } catch {
    // ignore invalid URLs
  }
  return null;
}
