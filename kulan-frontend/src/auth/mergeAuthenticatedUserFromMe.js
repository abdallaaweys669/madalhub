import authApi from '@/api/auth';
import { normalizeUser } from '@/auth/normalizeUser';

/** Refetch GET /auth/me and merge into the authenticated user (name, location, etc.). */
export async function mergeAuthenticatedUserFromMe(setUser) {
  try {
    const me = await authApi.getMe();
    setUser((prev) => (prev ? normalizeUser(prev, me) : prev));
  } catch {
    /* ignore */
  }
}
