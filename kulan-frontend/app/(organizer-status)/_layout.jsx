import React from 'react';
import { Stack } from 'expo-router';

export default function OrganizerStatusLayout() {
  return (
    <Stack>
      <Stack.Screen name="pending-verification" options={{ headerShown: false }} />
      <Stack.Screen name="verification-failed" options={{ headerShown: false }} />
      <Stack.Screen name="resubmit-verification" options={{ headerShown: false }} />
    </Stack>
  );
}
