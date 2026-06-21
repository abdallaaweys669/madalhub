import { Alert } from 'react-native';
import { getPublishEligibility, requestPublishCredits } from '@/api/organizer';

/**
 * Maps publish-eligibility API block codes to user-facing actions.
 * @param {import('@/hooks/useGuardedRouter').default} router
 * @param {{ canPublish?: boolean, blockCode?: string | null, hasPendingCreditRequest?: boolean } | null | undefined} eligibility
 * @param {{ eventId?: number | string, eventTitle?: string }} [options]
 * @returns {Promise<boolean>} true when publish can proceed
 */
export async function resolveOrganizerPublishGate(router, eligibility, options = {}) {
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
  if (code === 'CREDITS_REQUIRED') {
    if (eligibility.hasPendingCreditRequest) {
      Alert.alert(
        'Credits requested',
        'Your publish credit request is pending admin review. You will be notified when credits are added.',
      );
      return false;
    }

    try {
      await requestPublishCredits({
        eventId: options.eventId != null ? Number(options.eventId) : undefined,
        eventTitle: options.eventTitle?.trim() || undefined,
      });
      Alert.alert(
        'Request sent',
        'An admin has been notified. Once credits are added to your account, tap Publish again.',
      );
    } catch (error) {
      Alert.alert('Request failed', error?.message || 'Could not request publish credits.');
    }
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
  if (code === 'VERIFICATION_PENDING' || verificationStatus === 'pending') {
    return '/(organizer-status)/pending-verification';
  }
  if (
    code === 'VERIFICATION_REQUIRED' ||
    code === 'VERIFICATION_REJECTED' ||
    verificationStatus === 'unverified' ||
    verificationStatus === 'rejected'
  ) {
    return '/(organizer-status)/resubmit-verification';
  }
  return '/(organizer-status)/resubmit-verification';
}

/**
 * Checks publish eligibility and runs publishFn when allowed.
 * @param {import('@/hooks/useGuardedRouter').default} router
 * @param {() => Promise<void>} publishFn
 * @param {{ eventId?: number | string, eventTitle?: string }} [options]
 */
export async function attemptOrganizerPublish(router, publishFn, options = {}) {
  const eligibility = await getPublishEligibility();
  const canProceed = await resolveOrganizerPublishGate(router, eligibility, options);
  if (!canProceed) return false;
  await publishFn();
  return true;
}
