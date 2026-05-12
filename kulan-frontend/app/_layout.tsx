import React from 'react';
import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/features/onboarding/hooks/useOnboarding';
import { SavedEventsProvider } from '@/context/SavedEventsContext';
import { AuthProvider } from '@/context/AuthProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <SavedEventsProvider>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(organizer)" options={{ headerShown: false }} />
              <Stack.Screen name="(organizer-status)" options={{ headerShown: false }} />
              <Stack.Screen
                name="events/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="events/[id]/attendees"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="organizer/[id]" options={{ headerShown: false }} />
              <Stack.Screen
                name="(modal)/changePassword"
                options={{ presentation: 'modal', headerShown: false }}
              />
            </Stack>
          </SavedEventsProvider>
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
