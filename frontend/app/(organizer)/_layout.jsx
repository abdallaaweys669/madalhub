import React from 'react';
import { Redirect, Stack } from 'expo-router';

import useAuth from '@/auth/useAuth';

const ROLE_ORGANIZER = 2;

export default function OrganizerLayout() {
  const { isHydrated, userRole } = useAuth();

  if (!isHydrated) {
    return null;
  }

  if (userRole !== ROLE_ORGANIZER) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create-event" options={{ presentation: 'card' }} />
      <Stack.Screen name="edit-event" />
      <Stack.Screen name="manage-event" />
      <Stack.Screen name="pay-to-publish" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="attendees" />
      <Stack.Screen name="followers" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="my-events" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
