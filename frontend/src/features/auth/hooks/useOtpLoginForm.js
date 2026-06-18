import { useState } from 'react';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import authApi from '@/api/auth';
import {
  getEmailError,
  normalizeEmail,
  parseOtpApiMessage,
} from '@/features/auth/validation/authRules';

export default function useOtpLoginForm() {
  const router = useGuardedRouter();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const emailError = getEmailError(email);
  const isValid = !emailError;

  const onSubmit = async () => {
    setTouched(true);
    if (!isValid) return;

    setLoading(true);
    setFormError('');

    try {
      const normalized = normalizeEmail(email);
      await authApi.sendOtp({ email: normalized, purpose: 'login' });
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { purpose: 'login', email: normalized },
      });
    } catch (error) {
      setFormError(parseOtpApiMessage(error));
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
