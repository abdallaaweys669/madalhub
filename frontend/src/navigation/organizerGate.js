/**
 * Where an organizer should land based on verification (not member tabs).
 * @param {string | null | undefined} organizerStatus
 */
export function getOrganizerEntryHref(organizerStatus) {
  if (organizerStatus === 'approved') {
    return '/(organizer)/dashboard';
  }
  if (organizerStatus === 'rejected') {
    return '/(organizer-status)/verification-failed';
  }
  return '/(organizer-status)/pending-verification';
}
