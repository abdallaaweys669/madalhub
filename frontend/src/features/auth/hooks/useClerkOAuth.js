import { useState } from 'react';
import * as Linking from 'expo-linking';
import { useOAuth, useAuth } from '@clerk/expo';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useCustomAuth from '@/auth/useAuth';
import authApi from '@/api/auth';
import getClerkSessionToken from '@/features/auth/hooks/getClerkSessionToken';

const OAUTH_REDIRECT_URL = Linking.createURL('oauth-native-callback', {
  scheme: 'madalhub',
});

export default function useClerkOAuth(strategy) {
  const router = useGuardedRouter();
  const { login } = useCustomAuth();
  const { startOAuthFlow } = useOAuth({ strategy });
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: OAUTH_REDIRECT_URL,
      });

      if (!createdSessionId) {
        // User cancelled the OAuth flow
        return;
      }

      await setActive({ session: createdSessionId });
      const clerkToken = await getClerkSessionToken(getToken);
      if (!clerkToken) throw new Error('Could not get session token.');

      const result = await authApi.clerkExchange({ token: clerkToken, role: 'member' });
      if (!result.token) throw new Error('Missing auth token from server.');

      await login(result.token, result.onboardingCompleted);
      router.replace(result.onboardingCompleted ? '/(tabs)/' : '/onboarding/WelcomeIntro');
    } catch (err) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Social login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
}
