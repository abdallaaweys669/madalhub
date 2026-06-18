import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/expo';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useCustomAuth from '@/auth/useAuth';
import authApi from '@/api/auth';
import getClerkSessionToken from '@/features/auth/hooks/getClerkSessionToken';

/**
 * After Clerk native auth (AuthView / OAuth), exchange Clerk session for our backend JWT.
 */
export default function useClerkBackendSync() {
  const router = useGuardedRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { login, isLoggedIn } = useCustomAuth();
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || isLoggedIn || syncingRef.current) return;

    syncingRef.current = true;
    setSyncing(true);
    setError('');

    let cancelled = false;

    (async () => {
      try {
        const clerkToken = await getClerkSessionToken(getToken, 4, 300);
        if (!clerkToken) throw new Error('Could not get session token.');

        const result = await authApi.clerkExchange({ token: clerkToken, role: 'member' });
        if (!result.token) throw new Error('Missing auth token from server.');

        await login(result.token, result.onboardingCompleted);
        if (cancelled) return;

        router.replace(
          result.onboardingCompleted ? '/(tabs)/' : '/onboarding/WelcomeIntro',
        );
      } catch (err) {
        syncingRef.current = false;
        if (!cancelled) {
          setError(
            err?.errors?.[0]?.longMessage ||
              err?.message ||
              'Could not finish sign-in. Please try again.',
          );
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isLoggedIn, isSignedIn, login, router]);

  return { error, syncing: syncing && isSignedIn && !isLoggedIn };
}
