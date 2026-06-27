/**
 * Verification inbox items are only relevant for the matching account status.
 * Hides stale "Verification needs updates" rows after approval/resubmit.
 */
export function isOrganizerVerificationNotificationVisible(
  item,
  verificationStatus,
) {
  const status = String(verificationStatus ?? 'unverified').toLowerCase();
  if (item?.type === 'verification_rejected') return status === 'rejected';
  if (item?.type === 'verification_approved') return status === 'approved';
  return true;
}

export function shouldFollowOrganizerNotificationRoute(item, verificationStatus) {
  if (!item?.actionRoute) return false;
  if (
    item.type === 'verification_rejected' ||
    item.type === 'verification_approved'
  ) {
    return isOrganizerVerificationNotificationVisible(item, verificationStatus);
  }
  return true;
}
