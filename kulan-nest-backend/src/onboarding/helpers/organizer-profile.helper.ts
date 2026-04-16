import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';

export function isProfileComplete(profile: OrganizerProfile): boolean {
  return !!(
    profile.organization_name &&
    profile.organization_description
  );
}
