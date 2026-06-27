/**
 * In-memory flag: whether we've already shown the "You're Approved" screen
 * this session (reset on app restart).
 */
let _approvedScreenShownThisSession = false;

export function markApprovedScreenShown() {
  _approvedScreenShownThisSession = true;
}

/**
 * Returns the route an organizer should land on after auth,
 * based on their verification_status from the API.
 *
 * @param {string | null | undefined} verificationStatus
 * @returns {string}
 */
export function getOrganizerEntryHref(verificationStatus) {
  switch (verificationStatus) {
    case 'approved':
      if (_approvedScreenShownThisSession) {
        return '/(organizer)/(tabs)';
      }
      // Show "You're Approved" once per session, then dashboard
      return '/(organizer-status)/verification-approved';
    case 'pending':
      return '/(organizer-status)/pending-verification';
    case 'rejected':
      return '/(organizer-status)/verification-failed';
    case 'unverified':
    default:
      return '/(organizer-status)/welcome';
  }
}
