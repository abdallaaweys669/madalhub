import { OrganizerProfile } from 'src/database/entities/organizer-profile.entity';

export type PublishBlockCode =
  | 'VERIFICATION_REQUIRED'
  | 'VERIFICATION_PENDING'
  | 'VERIFICATION_REJECTED'
  | 'PAYMENT_REQUIRED';

export type PublishEligibility = {
  canPublish: boolean;
  blockCode: PublishBlockCode | null;
  verificationStatus: string;
  freePublishAvailable: boolean;
  paidPublishCredits: number;
  hasPendingPaymentRequest: boolean;
};

export function computePublishEligibility(
  profile: OrganizerProfile | null | undefined,
  hasPendingPaymentRequest = false,
): PublishEligibility {
  const verificationStatus = profile?.verificationStatus ?? 'unverified';
  const freePublishAvailable = profile ? !profile.freePublishUsed : false;
  const paidPublishCredits = profile?.paidPublishCredits ?? 0;

  if (verificationStatus === 'unverified') {
    return {
      canPublish: false,
      blockCode: 'VERIFICATION_REQUIRED',
      verificationStatus,
      freePublishAvailable,
      paidPublishCredits,
      hasPendingPaymentRequest,
    };
  }

  if (verificationStatus === 'pending') {
    return {
      canPublish: false,
      blockCode: 'VERIFICATION_PENDING',
      verificationStatus,
      freePublishAvailable,
      paidPublishCredits,
      hasPendingPaymentRequest,
    };
  }

  if (verificationStatus === 'rejected') {
    return {
      canPublish: false,
      blockCode: 'VERIFICATION_REJECTED',
      verificationStatus,
      freePublishAvailable,
      paidPublishCredits,
      hasPendingPaymentRequest,
    };
  }

  if (freePublishAvailable || paidPublishCredits > 0) {
    return {
      canPublish: true,
      blockCode: null,
      verificationStatus,
      freePublishAvailable,
      paidPublishCredits,
      hasPendingPaymentRequest,
    };
  }

  return {
    canPublish: false,
    blockCode: 'PAYMENT_REQUIRED',
    verificationStatus,
    freePublishAvailable: false,
    paidPublishCredits: 0,
    hasPendingPaymentRequest,
  };
}

export function assertCanPublish(
  profile: OrganizerProfile | null | undefined,
): PublishBlockCode | null {
  const eligibility = computePublishEligibility(profile);
  return eligibility.canPublish ? null : eligibility.blockCode;
}
