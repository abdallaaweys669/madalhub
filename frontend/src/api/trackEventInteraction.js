import apiClient from '@/api/client';

const SESSION_VIEWED_KEYS = new Set();

/**
 * Fire-and-forget member event interaction for recommendations.
 * @param {string|number} eventId
 * @param {'viewed'|'opened'|'shared'|'saved'|'registered'} action
 */
export function trackEventInteraction(eventId, action) {
  const normalizedId = Number(eventId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) return;
  if (!action) return;

  const sessionKey = `${action}:${normalizedId}`;
  if (action === 'viewed') {
    if (SESSION_VIEWED_KEYS.has(sessionKey)) return;
    SESSION_VIEWED_KEYS.add(sessionKey);
  }

  void apiClient
    .post('/events/interactions', { eventId: normalizedId, action })
    .catch(() => undefined);
}
