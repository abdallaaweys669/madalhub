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
