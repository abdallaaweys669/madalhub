import { useState } from 'react';
import { useSignIn } from '@clerk/expo';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { getEmailError, normalizeEmail } from '@/features/auth/validation/authRules';

export default function useClerkOtpLogin() {
  const router = useGuardedRouter();
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const emailError = getEmailError(email);
  const isValid = !emailError && isLoaded;

  const onSubmit = async () => {
    setTouched(true);
    if (!isValid || !signIn) return;

    setLoading(true);
    setFormError('');

    try {
      const normalized = normalizeEmail(email);
      const { supportedFirstFactors } = await signIn.create({ identifier: normalized });

      const emailFactor = supportedFirstFactors?.find((f) => f.strategy === 'email_code');
      if (!emailFactor) {
        throw new Error('Email code login is not enabled. Please use password login instead.');
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      router.push({
        pathname: '/(auth)/verify-otp',
        params: { purpose: 'login', email: normalized },
      });
    } catch (error) {
      const msg =
        error?.errors?.[0]?.longMessage ||
        error?.message ||
        'Could not send code. Please try again.';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    touched,
    emailError,
    loading,
    isValid,
    formError,
    onBlur: () => setTouched(true),
    onSubmit,
  };
}
