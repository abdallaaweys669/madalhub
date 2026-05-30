import { Redirect, Stack } from 'expo-router';
import { OnboardingProvider } from '@/features/onboarding/hooks/useOnboarding';
import useAuth from '@/auth/useAuth';

export default function OnboardingLayout() {
  const { isLoggedIn, isHydrated } = useAuth();

  if (!isHydrated) return null;

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

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
