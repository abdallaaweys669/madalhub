type JwtPayload = {
  role?: number | string;
  roleId?: number | string;
  exp?: number | string;
};

function decodeBase64UrlSegment(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized + "=".repeat(4 - padding);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf-8");
  }

  return atob(padded);
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(decodeBase64UrlSegment(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function isAdminAccessToken(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload) return false;

  const exp = Number(payload.exp);
  if (!Number.isNaN(exp) && exp > 0 && exp * 1000 < Date.now()) {
    return false;
  }

  return Number(payload.role ?? payload.roleId) === 3;
}
