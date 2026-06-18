import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSignIn, useSignUp, useAuth } from '@clerk/expo';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useCustomAuth from '@/auth/useAuth';
import authApi from '@/api/auth';
import getClerkSessionToken from '@/features/auth/hooks/getClerkSessionToken';
import {
  consumePendingSignupDraft,
  peekPendingSignupDraft,
} from '@/features/auth/signupDraft';
import { getOtpCodeError, normalizeEmail } from '@/features/auth/validation/authRules';

const RESEND_SECONDS = 60;

export default function useClerkOtpVerify({ purpose, email: initialEmail, phone: initialPhone }) {
  const router = useGuardedRouter();
  const { login } = useCustomAuth();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { getToken } = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  const email = useMemo(
    () => normalizeEmail(initialEmail || peekPendingSignupDraft()?.email || ''),
    [initialEmail],
  );

  const displayIdentifier = initialPhone || email;

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const codeError = getOtpCodeError(code);
  const isValid = !codeError;

  const resend = useCallback(async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setFormError('');
    try {
      if (purpose === 'login' && signIn) {
        const emailFactor = signIn.supportedFirstFactors?.find(
          (f) => f.strategy === 'email_code',
        );
        if (emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
        }
      } else if (purpose === 'phone_login' && signIn) {
        const phoneFactor = signIn.supportedFirstFactors?.find(
          (f) => f.strategy === 'phone_code',
        );
        if (phoneFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneFactor.phoneNumberId,
          });
        }
      } else if (purpose === 'signup' && signUp) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      }
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      setFormError(error?.errors?.[0]?.longMessage || 'Could not resend code. Try again.');
    } finally {
      setResending(false);
    }
  }, [cooldown, purpose, resending, signIn, signUp]);

  const verify = useCallback(async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setFormError('');

    try {
      if (purpose === 'login' || purpose === 'phone_login') {
        if (!signIn) throw new Error('Sign-in session expired. Please go back and try again.');

        const strategy = purpose === 'phone_login' ? 'phone_code' : 'email_code';
        const result = await signIn.attemptFirstFactor({ strategy, code });
        if (result.status !== 'complete') {
          throw new Error('Verification incomplete. Please try again.');
        }

        await setSignInActive({ session: result.createdSessionId });
        const clerkToken = await getClerkSessionToken(getToken);
        if (!clerkToken) throw new Error('Could not get session token.');

        const backendResult = await authApi.clerkExchange({ token: clerkToken, role: 'member' });
        if (!backendResult.token) throw new Error('Missing auth token from server.');

        await login(backendResult.token, backendResult.onboardingCompleted);
        router.replace(
          backendResult.onboardingCompleted ? '/(tabs)/' : '/onboarding/WelcomeIntro',
        );
        return;
      }

      // signup
      if (!signUp) throw new Error('Sign-up session expired. Please go back and try again.');

      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status !== 'complete') {
        throw new Error('Verification incomplete. Please try again.');
      }

      await setSignUpActive({ session: result.createdSessionId });
      const clerkToken = await getClerkSessionToken(getToken);
      if (!clerkToken) throw new Error('Could not get session token.');

      const draft = consumePendingSignupDraft();

      const backendResult = await authApi.clerkExchange({
        token: clerkToken,
        role: 'member',
        fullName: draft?.full_name,
        password: draft?.password,
      });

      if (!backendResult.token) throw new Error('Missing auth token from server.');
      await login(backendResult.token, backendResult.onboardingCompleted);
      router.replace(
        backendResult.onboardingCompleted ? '/(tabs)/' : '/onboarding/WelcomeIntro',
      );
    } catch (error) {
      setFormError(
        error?.errors?.[0]?.longMessage ||
          error?.message ||
          'Verification failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [
    code,
    getToken,
    isValid,
    loading,
    login,
    purpose,
    router,
    setSignInActive,
    setSignUpActive,
    signIn,
    signUp,
  ]);

  return {
    email,
    displayIdentifier,
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
