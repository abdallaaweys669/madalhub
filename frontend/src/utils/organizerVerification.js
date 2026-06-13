/**
 * Matches backend admin approval rules: profile complete (name + description) + one document.
 * @param {{ verificationStatus?: string, organizationName?: string | null, organizationDescription?: string | null, hasDocument?: boolean } | null | undefined} status
 */
export function isOrganizerSubmissionReadyForReview(status) {
  if (!status || status.verificationStatus !== 'pending') {
    return true;
  }
  const name = typeof status.organizationName === 'string' ? status.organizationName.trim() : '';
  const desc =
    typeof status.organizationDescription === 'string'
      ? status.organizationDescription.trim()
      : '';
  const hasDoc = Boolean(status.hasDocument);
  return name.length > 0 && desc.length > 0 && hasDoc;
}
