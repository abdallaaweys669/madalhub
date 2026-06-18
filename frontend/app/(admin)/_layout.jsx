import React from 'react';
import { Redirect, Stack, useSegments } from 'expo-router';

import useAuth from '@/auth/useAuth';

const ROLE_ADMIN = 3;

export default function AdminLayout() {
  const { isHydrated, isLoggedIn, userRole } = useAuth();
  const segments = useSegments();
  const onLoginScreen = segments.includes('login');

  if (!isHydrated) {
    return null;
  }

  if (!isLoggedIn && !onLoginScreen) {
    return <Redirect href="/(admin)/login" />;
  }

  if (isLoggedIn && userRole !== ROLE_ADMIN && !onLoginScreen) {
    return <Redirect href="/(tabs)/explore" />;
  }

  if (isLoggedIn && userRole === ROLE_ADMIN && onLoginScreen) {
    return <Redirect href="/(admin)/organizers" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
      <Stack.Screen name="organizers" />
      <Stack.Screen name="payments" />
    </Stack>
  );
}
