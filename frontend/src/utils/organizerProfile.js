/**
 * True when the organizer still needs a real bio (not empty or auto-copied org name).
 * @param {{ organizationName?: string | null, organizationDescription?: string | null } | null | undefined} profile
 */
export function needsOrganizerBio(profile) {
  const name = String(profile?.organizationName ?? '').trim();
  const description = String(profile?.organizationDescription ?? '').trim();
  if (!description) return true;
  if (name && description.toLowerCase() === name.toLowerCase()) return true;
  return false;
}
