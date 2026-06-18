import { useState } from 'react';
import { useSignIn } from '@clerk/expo';
import useGuardedRouter from '@/hooks/useGuardedRouter';

export default function useClerkPhoneLogin() {
  const router = useGuardedRouter();
  const { signIn, isLoaded } = useSignIn();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const phoneError =
    phone.trim().length < 7 ? 'Enter a valid phone number with country code (e.g. +252...)' : '';
  const isValid = !phoneError && isLoaded;

  const onSubmit = async () => {
    setTouched(true);
    if (!isValid || !signIn) return;

    setLoading(true);
    setFormError('');

    try {
      const { supportedFirstFactors } = await signIn.create({ identifier: phone.trim() });

      const phoneFactor = supportedFirstFactors?.find((f) => f.strategy === 'phone_code');
      if (!phoneFactor) {
        throw new Error('Phone code login is not enabled or this number has no account.');
      }

      await signIn.prepareFirstFactor({
        strategy: 'phone_code',
        phoneNumberId: phoneFactor.phoneNumberId,
      });

      router.push({
        pathname: '/(auth)/verify-otp',
        params: { purpose: 'phone_login', phone: phone.trim() },
      });
    } catch (error) {
      const msg =
        error?.errors?.[0]?.longMessage ||
        error?.message ||
        'Could not send code. Check the number and try again.';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    phone,
    setPhone,
    touched,
    phoneError,
    loading,
    isValid,
    formError,
    onBlur: () => setTouched(true),
    onSubmit,
  };
}
