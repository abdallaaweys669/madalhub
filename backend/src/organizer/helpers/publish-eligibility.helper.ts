import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';

export type PublishBlockCode =
  | 'VERIFICATION_REQUIRED'
  | 'VERIFICATION_PENDING'
  | 'VERIFICATION_REJECTED'
  | 'CREDITS_REQUIRED';

export type PublishEligibility = {
  canPublish: boolean;
  blockCode: PublishBlockCode | null;
  verificationStatus: string;
  paidPublishCredits: number;
  hasPendingCreditRequest: boolean;
};

export function computePublishEligibility(
  profile: OrganizerProfile | null | undefined,
  hasPendingCreditRequest = false,
): PublishEligibility {
  const verificationStatus = profile?.verificationStatus ?? 'unverified';
  const paidPublishCredits = profile?.paidPublishCredits ?? 0;

  if (verificationStatus === 'unverified') {
    return {
      canPublish: false,
      blockCode: 'VERIFICATION_REQUIRED',
      verificationStatus,
      paidPublishCredits,
      hasPendingCreditRequest,
    };
  }

  if (verificationStatus === 'pending') {
    return {
      canPublish: false,
      blockCode: 'VERIFICATION_PENDING',
      verificationStatus,
      paidPublishCredits,
      hasPendingCreditRequest,
    };
  }

  if (verificationStatus === 'rejected') {
    return {
      canPublish: false,
      blockCode: 'VERIFICATION_REJECTED',
      verificationStatus,
      paidPublishCredits,
      hasPendingCreditRequest,
    };
  }

  if (paidPublishCredits > 0) {
    return {
      canPublish: true,
      blockCode: null,
      verificationStatus,
      paidPublishCredits,
      hasPendingCreditRequest,
    };
  }

  return {
    canPublish: false,
    blockCode: 'CREDITS_REQUIRED',
    verificationStatus,
    paidPublishCredits: 0,
    hasPendingCreditRequest,
  };
}

export function assertCanPublish(
  profile: OrganizerProfile | null | undefined,
): PublishBlockCode | null {
  const eligibility = computePublishEligibility(profile);
  return eligibility.canPublish ? null : eligibility.blockCode;
}
