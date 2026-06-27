export function hasOnlinePresenceProof(profile: {
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
}): boolean {
  return [profile.website, profile.facebook, profile.instagram].some(
    (value) => String(value ?? '').trim().length >= 2,
  );
}

export type VerificationProofType = 'document' | 'online_presence' | 'none';

export function resolveVerificationProofType(
  hasDocument: boolean,
  hasOnlinePresence: boolean,
): VerificationProofType {
  if (hasDocument) return 'document';
  if (hasOnlinePresence) return 'online_presence';
  return 'none';
}
