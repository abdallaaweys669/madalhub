import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';

export function isProfileComplete(profile: OrganizerProfile): boolean {
  const name = profile.organizationName?.trim();
  if (!name) return false;
  const description = profile.organizationDescription?.trim();
  // Verification wizard may only collect org name; name alone is enough to approve.
  return !!(description || name);
}
