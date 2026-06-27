/** At least one public link when submitting without a document. */
export function hasOnlinePresenceProof({ website = '', facebook = '', instagram = '' } = {}) {
  return [website, facebook, instagram].some((value) => String(value || '').trim().length >= 2);
}

export function buildFacebookUrl(handle = '') {
  const slug = String(handle || '').trim().replace(/^@/, '');
  return slug ? `https://facebook.com/${slug}` : '';
}

export function buildInstagramUrl(handle = '') {
  const slug = String(handle || '').trim().replace(/^@/, '');
  return slug ? `https://instagram.com/${slug}` : '';
}

export function normalizeWebsiteUrl(url = '') {
  const raw = String(url || '').trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}
