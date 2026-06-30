import React, { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';

import useAuth from '@/auth/useAuth';
import { OrganizerNotificationBadgeProvider } from '@/features/organizer/hooks/OrganizerNotificationBadgeContext';
import { getOrganizerStatus } from '@/api/organizer';

const ROLE_ORGANIZER = 2;

export default function OrganizerLayout() {
  const { isHydrated, isLoggedIn, userRole } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [statusChecked, setStatusChecked] = useState(false);

  useEffect(() => {
    if (!isHydrated || !isLoggedIn || userRole !== ROLE_ORGANIZER) return;
    getOrganizerStatus()
      .then((s) => {
        setVerificationStatus(s?.verificationStatus ?? 'unverified');
      })
      .catch(() => {
        setVerificationStatus('unverified');
      })
      .finally(() => setStatusChecked(true));
  }, [isHydrated, isLoggedIn, userRole]);

  if (!isHydrated) {
    return null;
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (userRole !== ROLE_ORGANIZER) {
    return <Redirect href="/(tabs)/explore" />;
  }

  if (!statusChecked) {
    // Still fetching status — render nothing while the check completes
    return null;
  }

  if (verificationStatus !== 'approved') {
    // Map directly without the session-gate logic (that's for splash/login only)
    const GATE_MAP = {
      pending: '/(organizer-status)/pending-verification',
      rejected: '/(organizer-status)/verification-failed',
      unverified: '/(organizer-status)/welcome',
    };
    const fallback = GATE_MAP[verificationStatus] ?? '/(organizer-status)/welcome';
    return <Redirect href={fallback} />;
  }

  return (
    <OrganizerNotificationBadgeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create-event" options={{ presentation: 'card' }} />
        <Stack.Screen name="edit-event" />
        <Stack.Screen name="manage-event" />
        <Stack.Screen name="manage-agenda" />
        <Stack.Screen name="pay-to-publish" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="attendees" />
        <Stack.Screen name="followers" />
        <Stack.Screen name="reviews" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="reports/[type]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="my-events" />
        <Stack.Screen name="profile" />
      </Stack>
    </OrganizerNotificationBadgeProvider>
  );
}
