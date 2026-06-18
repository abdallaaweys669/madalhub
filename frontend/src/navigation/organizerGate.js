/**
 * Where an organizer should land after auth (always dashboard in progressive model).
 * @param {string | null | undefined} _organizerStatus
 */
export function getOrganizerEntryHref(_organizerStatus) {
  return '/(organizer)/dashboard';
}
