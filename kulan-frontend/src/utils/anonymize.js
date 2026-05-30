const ROLE_MEMBER = 1;
const ROLE_ORGANIZER = 2;
const ROLE_ADMIN = 3;

const ANONYMOUS_LABEL = 'Anonymous Member';
const ANONYMOUS_SHORT = 'Anonymous';

export function canViewerSeeHiddenProfile(viewerRole) {
  const role = viewerRole != null ? Number(viewerRole) : null;
  return role === ROLE_ORGANIZER || role === ROLE_ADMIN;
}

export function isProfileAccessible(profile, viewerRole, viewerId) {
  if (!profile) return false;
  const profileHidden = Boolean(profile.profileHidden ?? profile.profile_hidden);
  if (!profileHidden) return true;
  const isSelf = viewerId != null && Number(viewerId) === Number(profile.id);
  if (isSelf) return true;
  return canViewerSeeHiddenProfile(viewerRole);
}

export function getAnonymousDisplayName(isAnonymous, originalName) {
  if (!isAnonymous) return originalName || 'Member';
  return ANONYMOUS_LABEL;
}

export function getAnonymousShortName(isAnonymous, originalName) {
  if (!isAnonymous) return originalName || 'Member';
  return ANONYMOUS_SHORT;
}

export function getAnonymousAvatar(avatarUrl, isAnonymous) {
  if (!isAnonymous) return avatarUrl || null;
  return null;
}

export function formatAttendeeForDisplay(attendee, viewerRole, viewerId) {
  if (!attendee) return null;
  const isAnonymous = Boolean(attendee.isAnonymous ?? attendee.profileHidden ?? attendee.profile_hidden);
  const uid = attendee.userId ?? attendee.id;
  const isSelf = viewerId != null && uid != null && Number(viewerId) === Number(uid);
  const shouldHide = isAnonymous && !isSelf && !canViewerSeeHiddenProfile(viewerRole);

  return {
    id: shouldHide ? null : uid,
    displayName: shouldHide ? ANONYMOUS_LABEL : (attendee.name || attendee.fullName || 'Member'),
    avatarUrl: shouldHide ? null : (attendee.avatarUrl || attendee.avatar || attendee.profileImg || null),
    isAnonymous: shouldHide ? true : false,
    canNavigate: !shouldHide && uid != null,
    originalUserId: uid,
  };
}

export function getAnonymousPlaceholder(index) {
  return {
    id: null,
    displayName: ANONYMOUS_LABEL,
    avatarUrl: null,
    isAnonymous: true,
    canNavigate: false,
    originalUserId: null,
    key: `anonymous-${index}`,
  };
}
