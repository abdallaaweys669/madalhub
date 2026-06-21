import React from 'react';
import { Redirect, Stack } from 'expo-router';

import useAuth from '@/auth/useAuth';
import { OrganizerNotificationBadgeProvider } from '@/features/organizer/hooks/OrganizerNotificationBadgeContext';

const ROLE_ORGANIZER = 2;

export default function OrganizerLayout() {
  const { isHydrated, isLoggedIn, userRole } = useAuth();

  if (!isHydrated) {
    return null;
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (userRole !== ROLE_ORGANIZER) {
    return <Redirect href="/(tabs)/explore" />;
  }

  return (
    <OrganizerNotificationBadgeProvider>
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
    </OrganizerNotificationBadgeProvider>
  );
}
