import authStorage from '@/auth/storage';

export const GUEST_EXPLORE_HREF = '/(tabs)/explore';

export async function hasGuestWelcomeSeen() {
  return authStorage.getGuestWelcomeSeen();
}

export async function markGuestWelcomeSeen() {
  await authStorage.storeGuestWelcomeSeen();
}
