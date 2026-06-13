import React from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OnboardingProvider } from '@/features/onboarding/hooks/useOnboarding';
import { SavedEventsProvider } from '@/context/SavedEventsContext';
import { AuthProvider } from '@/context/AuthProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

LogBox.ignoreLogs([
  '[Reanimated] Reduced motion setting is enabled',
  'setLayoutAnimationEnabledExperimental is currently a no-op',
]);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
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
                <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="events/[id]/going" options={{ headerShown: false }} />
                <Stack.Screen name="events/[id]/ticket" options={{ headerShown: false }} />
                <Stack.Screen name="events/[id]/attendees" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="organizer/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(modal)/changePassword" options={{ presentation: 'modal', headerShown: false }} />
              </Stack>
            </SavedEventsProvider>
          </OnboardingProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
