import { getPublishEligibility } from '@/api/organizer';

/**
 * Maps publish-eligibility API block codes to user-facing actions.
 * @param {import('@/hooks/useGuardedRouter').default} router
 * @param {{ canPublish?: boolean, blockCode?: string | null } | null | undefined} eligibility
 * @returns {Promise<boolean>} true when publish can proceed
 */
export async function resolveOrganizerPublishGate(router, eligibility) {
  if (eligibility?.canPublish) return true;

  const code = eligibility?.blockCode;
  if (code === 'VERIFICATION_REQUIRED' || code === 'VERIFICATION_REJECTED') {
    router.push('/(organizer-status)/resubmit-verification');
    return false;
  }
  if (code === 'VERIFICATION_PENDING') {
    router.push('/(organizer-status)/pending-verification');
    return false;
  }
  if (code === 'PAYMENT_REQUIRED') {
    router.push('/(organizer)/pay-to-publish');
    return false;
  }

  router.push('/(organizer-status)/resubmit-verification');
  return false;
}

/**
 * Short banner copy for dashboard status chip.
 */
export function getOrganizerDashboardBanner(eligibility, verificationStatus) {
  if (!eligibility) {
    if (verificationStatus === 'pending') return { text: 'Verification under review', tone: 'pending' };
    if (verificationStatus === 'unverified') return { text: 'Verify to publish events', tone: 'action' };
    return null;
  }
  if (eligibility.blockCode === 'VERIFICATION_PENDING' || verificationStatus === 'pending') {
    return { text: 'Verification under review', tone: 'pending' };
  }
  if (eligibility.blockCode === 'VERIFICATION_REQUIRED' || verificationStatus === 'unverified') {
    return { text: 'Complete verification to publish', tone: 'action' };
  }
  if (eligibility.blockCode === 'VERIFICATION_REJECTED' || verificationStatus === 'rejected') {
    return { text: 'Verification rejected — update and resubmit', tone: 'danger' };
  }
  if (eligibility.freePublishAvailable) {
    return { text: 'You have 1 free publish available', tone: 'success' };
  }
  if (eligibility.paidPublishCredits > 0) {
    return {
      text: `${eligibility.paidPublishCredits} publish credit${eligibility.paidPublishCredits === 1 ? '' : 's'} left`,
      tone: 'success',
    };
  }
  if (eligibility.hasPendingPaymentRequest) {
    return { text: 'Payment submitted — awaiting approval', tone: 'pending' };
  }
  if (eligibility.blockCode === 'PAYMENT_REQUIRED') {
    return { text: 'Pay to publish more events', tone: 'action' };
  }
  return null;
}

const BANNER_TONE_STYLES = {
  action: { bg: '#FFF7ED', border: '#FFDBBF', fg: '#C2410C' },
  pending: { bg: '#EFF6FF', border: '#BFDBFE', fg: '#1D4ED8' },
  success: { bg: '#ECFDF5', border: '#A7F3D0', fg: '#047857' },
  danger: { bg: '#FEF2F2', border: '#FECACA', fg: '#B91C1C' },
};

export function getOrganizerBannerStyles(tone) {
  return BANNER_TONE_STYLES[tone] ?? BANNER_TONE_STYLES.action;
}

export function getOrganizerBannerPressHref(eligibility, verificationStatus) {
  const code = eligibility?.blockCode;
  if (code === 'PAYMENT_REQUIRED') return '/(organizer)/pay-to-publish';
  if (code === 'VERIFICATION_PENDING' || verificationStatus === 'pending') {
    return '/(organizer-status)/pending-verification';
  }
  return '/(organizer-status)/resubmit-verification';
}

/**
 * Checks publish eligibility and runs publishFn when allowed.
 * @param {import('@/hooks/useGuardedRouter').default} router
 * @param {() => Promise<void>} publishFn
 */
export async function attemptOrganizerPublish(router, publishFn) {
  const eligibility = await getPublishEligibility();
  const canProceed = await resolveOrganizerPublishGate(router, eligibility);
  if (!canProceed) return false;
  await publishFn();
  return true;
}
