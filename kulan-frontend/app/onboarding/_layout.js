import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/features/onboarding/hooks/useOnboarding';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
    </OnboardingProvider>
  );
}
