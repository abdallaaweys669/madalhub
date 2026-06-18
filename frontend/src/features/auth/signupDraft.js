let pendingSignupDraft = null;

/** In-memory holder for signup fields between signup and OTP screens (avoids putting password in URL). */
export function setPendingSignupDraft(draft) {
  pendingSignupDraft = draft ? { ...draft } : null;
}

export function peekPendingSignupDraft() {
  return pendingSignupDraft ? { ...pendingSignupDraft } : null;
}

export function consumePendingSignupDraft() {
  const draft = pendingSignupDraft;
  pendingSignupDraft = null;
  return draft;
}

export function clearPendingSignupDraft() {
  pendingSignupDraft = null;
}
