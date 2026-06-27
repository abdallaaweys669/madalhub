export function normalizeWebsiteUrl(url: string) {
  const raw = url.trim();
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function facebookUrl(handle: string) {
  const slug = handle.trim().replace(/^@/, "");
  return slug ? `https://facebook.com/${slug}` : "";
}

export function instagramUrl(handle: string) {
  const slug = handle.trim().replace(/^@/, "");
  return slug ? `https://instagram.com/${slug}` : "";
}

export function canApproveVerification(row: {
  hasDocument: boolean;
  hasOnlinePresence: boolean;
}) {
  return row.hasDocument || row.hasOnlinePresence;
}
