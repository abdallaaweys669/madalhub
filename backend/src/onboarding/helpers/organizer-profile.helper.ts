import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';

export function isProfileComplete(profile: OrganizerProfile): boolean {
  return !!(profile.organizationName && profile.organizationDescription);
}
