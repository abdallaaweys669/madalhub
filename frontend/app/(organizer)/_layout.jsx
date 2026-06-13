import React from 'react';
import { Redirect, Stack } from 'expo-router';

import useAuth from '@/auth/useAuth';
import { getOrganizerEntryHref } from '@/navigation/organizerGate';

const ROLE_ORGANIZER = 2;

export default function OrganizerLayout() {
  const { isHydrated, userRole, organizerStatus } = useAuth();

  if (!isHydrated) {
    return null;
  }

  if (userRole !== ROLE_ORGANIZER) {
    return <Redirect href="/(tabs)" />;
  }

  if (organizerStatus !== 'approved') {
    return <Redirect href={getOrganizerEntryHref(organizerStatus)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="my-events" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="create-event" />
      <Stack.Screen name="edit-event" />
    </Stack>
  );
}
