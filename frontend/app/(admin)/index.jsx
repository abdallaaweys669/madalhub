import { Redirect } from 'expo-router';

import useAuth from '@/auth/useAuth';

const ROLE_ADMIN = 3;

export default function AdminIndex() {
  const { isHydrated, isLoggedIn, userRole } = useAuth();

  if (!isHydrated) return null;

  if (isLoggedIn && userRole === ROLE_ADMIN) {
    return <Redirect href="/(admin)/organizers" />;
  }

  return <Redirect href="/(admin)/login" />;
}
