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
              <Stack.Screen
                name="events/[id]"
                options={{ title: 'Event Details' }}
              />
            </Stack>
          </SavedEventsProvider>
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}