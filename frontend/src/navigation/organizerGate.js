import authStorage from '@/auth/storage';
import { jwtDecode } from 'jwt-decode';
import { getOrganizerEvents } from '@/api/organizer';

/** @type {Record<string, boolean>} */
const approvedScreenSeenCache = {};

function toUserKey(userId) {
  if (userId == null) return null;
  return String(userId);
}

export async function resolveOrganizerUserId(user) {
  const direct = toUserKey(user?.id ?? user?.userId);
  if (direct) return direct;

  try {
    const token = await authStorage.getToken();
    if (!token) return null;
    const decoded = jwtDecode(token);
    return toUserKey(decoded?.sub ?? decoded?.id);
  } catch {
    return null;
  }
}

export async function hydrateOrganizerApprovedScreen(userId) {
  const key = toUserKey(userId);
  if (!key) return;
  if (Object.prototype.hasOwnProperty.call(approvedScreenSeenCache, key)) return;
  approvedScreenSeenCache[key] = await authStorage.getOrganizerApprovedScreenSeen(key);
}

export async function markApprovedScreenShown(userId) {
  const key = toUserKey(userId);
  if (!key) return;
  approvedScreenSeenCache[key] = true;
  await authStorage.storeOrganizerApprovedScreenSeen(key);
}

export function hasSeenOrganizerApprovedScreen(userId) {
  const key = toUserKey(userId);
  if (!key) return false;
  return Boolean(approvedScreenSeenCache[key]);
}

/** Organizers who already have events were approved before this screen existed. */
async function autoMarkApprovedScreenForVeteranOrganizer(userId) {
  const key = toUserKey(userId);
  if (!key || hasSeenOrganizerApprovedScreen(key)) return;

  try {
    const events = await getOrganizerEvents();
    const list = Array.isArray(events) ? events : [];
    if (list.length > 0) {
      await markApprovedScreenShown(key);
    }
  } catch {
    // If events can't load, keep the one-time celebration path.
  }
}

/**
 * Returns the route an organizer should land on after auth,
 * based on their verification_status from the API.
 *
 * Call hydrateOrganizerApprovedScreen(userId) first, or use resolveOrganizerEntryHref().
 *
 * @param {string | null | undefined} verificationStatus
 * @param {number | string | null | undefined} userId
 * @returns {string}
 */
export function getOrganizerEntryHref(verificationStatus, userId) {
  switch (verificationStatus) {
    case 'approved':
      if (hasSeenOrganizerApprovedScreen(userId)) {
        return '/(organizer)/(tabs)';
      }
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

export async function resolveOrganizerEntryHref(verificationStatus, userId) {
  const key = toUserKey(userId);
  await hydrateOrganizerApprovedScreen(key);
  if (verificationStatus === 'approved') {
    await autoMarkApprovedScreenForVeteranOrganizer(key);
  }
  return getOrganizerEntryHref(verificationStatus, key);
}

export async function prepareOrganizerApprovedScreenGate(userId, verificationStatus) {
  const key = toUserKey(userId);
  await hydrateOrganizerApprovedScreen(key);
  if (verificationStatus === 'approved') {
    await autoMarkApprovedScreenForVeteranOrganizer(key);
  }
}
