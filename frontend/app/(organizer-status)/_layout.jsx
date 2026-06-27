import React from 'react';
import { Stack } from 'expo-router';

import { OrganizerVerificationStatusProvider } from '@/features/organizer/verification/components/OrganizerVerificationStatusProvider';

export default function OrganizerStatusLayout() {
  return (
    <OrganizerVerificationStatusProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="verification-submitted" />
        <Stack.Screen name="pending-verification" />
        <Stack.Screen name="verification-approved" />
        <Stack.Screen name="verification-failed" />
        <Stack.Screen name="resubmit-summary" />
        <Stack.Screen name="resubmit-verification" />
      </Stack>
    </OrganizerVerificationStatusProvider>
  );
}
