import { useCallback, useEffect, useMemo, useState } from 'react';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import authApi from '@/api/auth';
import useAuth from '@/auth/useAuth';
import {
  consumePendingSignupDraft,
  peekPendingSignupDraft,
} from '@/features/auth/signupDraft';
import {
  getOtpCodeError,
  normalizeEmail,
  parseOtpApiMessage,
} from '@/features/auth/validation/authRules';

const RESEND_SECONDS = 60;

export default function useOtpVerify({ purpose, email: initialEmail }) {
  const router = useGuardedRouter();
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  const email = useMemo(
    () => normalizeEmail(initialEmail || peekPendingSignupDraft()?.email || ''),
    [initialEmail],
  );

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const codeError = getOtpCodeError(code);
  const isValid = !codeError;

  const resend = useCallback(async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setFormError('');
    try {
      await authApi.sendOtp({ email, purpose });
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      setFormError(parseOtpApiMessage(error));
    } finally {
      setResending(false);
    }
  }, [cooldown, email, purpose, resending]);

  const verify = useCallback(async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setFormError('');

    try {
      if (purpose === 'login') {
        const result = await authApi.verifyOtpLogin({ email, code });
        if (!result.token) throw new Error('Missing auth token from login response.');
        await login(result.token, result.onboardingCompleted);
        router.replace(
          result.onboardingCompleted ? '/(tabs)/' : '/onboarding/WelcomeIntro',
        );
        return;
      }

      const draft = consumePendingSignupDraft();
      if (!draft) {
        setFormError('Signup session expired. Please start again.');
        router.replace('/(auth)/signup');
        return;
      }

      const result = await authApi.verifyOtpSignup({
        email: draft.email,
        code,
        full_name: draft.full_name,
        password: draft.password,
      });

      if (!result.token) throw new Error('Missing auth token from signup response.');
      await login(result.token, result.onboardingCompleted);
      router.replace(
        result.onboardingCompleted ? '/(tabs)/' : '/onboarding/WelcomeIntro',
      );
    } catch (error) {
      setFormError(parseOtpApiMessage(error));
    } finally {
      setLoading(false);
    }
  }, [code, email, isValid, loading, login, purpose, router]);

  return {
    email,
    code,
    setCode,
    codeError,
    isValid,
    loading,
    resending,
    cooldown,
    formError,
    resend,
    verify,
  };
}
