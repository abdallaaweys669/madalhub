/** Display labels for `event_format` / template keys (shared by create flow + event detail). */
export const EVENT_FORMAT_LABELS = {
  meetup: 'Meetup',
  panel: 'Panel',
  seminar: 'Seminar',
  workshop: 'Workshop',
  talk: 'Talk',
  bootcamp: 'Bootcamp',
  conference: 'Conference',
  summit: 'Summit',
  hackathon: 'Hackathon',
};

/**
 * @param {string | null | undefined} raw
 * @returns {string} Human-readable label, or '' if unset.
 */
export function formatKeyToDisplayLabel(raw) {
  if (raw == null) return '';
  const str = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw : '';
  const key = str.trim().toLowerCase();
  if (!key) return '';
  if (EVENT_FORMAT_LABELS[key]) return EVENT_FORMAT_LABELS[key];
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}
