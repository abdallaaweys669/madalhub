import { getToken } from "./auth";
import { isAdminAccessToken, parseJwtPayload } from "./jwt";

export type AdminSession = {
  id: number;
  email: string;
  initial: string;
};

export function getAdminSession(): AdminSession | null {
  const token = getToken();
  if (!token || !isAdminAccessToken(token)) return null;

  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const email = String(payload.email ?? "").trim();
  const id = Number(payload.sub);
  const initial = (email[0] ?? "A").toUpperCase();

  return {
    id: Number.isFinite(id) ? id : 0,
    email,
    initial,
  };
}
