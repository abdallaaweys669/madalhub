const FALLBACK_BASE_URL = 'http://127.0.0.1:3000';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

/**
 * Turns `/uploads/foo.jpg` into `https://api.../uploads/foo.jpg`.
 * Leaves full http(s) URLs unchanged.
 */
export function resolveApiAssetUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return undefined;
  const raw = pathOrUrl.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;

  const base = trimTrailingSlash(
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || FALLBACK_BASE_URL,
  );
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}

/** Raw profile image path from API user objects (camelCase or snake_case). */
export function pickProfileImagePath(
  user: { profileImg?: string | null; profile_img?: string | null; avatarUrl?: string | null; avatar_url?: string | null } | null | undefined,
): string | undefined {
  if (!user) return undefined;
  const candidates = [user.profileImg, user.profile_img, user.avatarUrl, user.avatar_url];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

/** Resolved profile photo URL with a stable cache-bust query when the stored path changes. */
export function buildProfileImageUri(
  user: Parameters<typeof pickProfileImagePath>[0],
): string | undefined {
  const raw = pickProfileImagePath(user);
  if (!raw) return undefined;
  const resolved = resolveApiAssetUrl(raw);
  if (!resolved) return undefined;
  const bust = encodeURIComponent(raw);
  return `${resolved}${resolved.includes('?') ? '&' : '?'}v=${bust}`;
}
