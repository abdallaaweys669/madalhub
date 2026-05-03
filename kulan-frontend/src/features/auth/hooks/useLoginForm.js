import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import api from '@/api/auth';
import useAuth from '@/auth/useAuth';
import { getLoginErrors } from '@/features/auth/validation/authRules';

export default function useLoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fieldErrors = useMemo(() => getLoginErrors(values), [values]);
  const isValid = !fieldErrors.email && !fieldErrors.password;

  const onChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onSubmit = async () => {
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setLoading(true);
    setFormError('');

    try {
      const result = await api.login(values);

      if (!result.token) {
        throw new Error('Missing auth token from login response.');
      }

      await login(result.token, result.onboardingCompleted);

      router.replace(
        result.onboardingCompleted
          ? '/(tabs)/'
          : '/onboarding/WelcomeIntro'
      );
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const rawMessage =
          error.response.data?.message ||
          'Invalid email or password. Please try again.';
        if (rawMessage.includes('organizer login') || rawMessage.includes('Welcome screen')) {
          setFormError(
            rawMessage + '\n\nTap "Login as Organizer" on Welcome.'
          );
        } else {
          setFormError(rawMessage);
        }
      } else if (error.message) {
        const rawMessage = error.message;
        if (rawMessage.includes('organizer login') || rawMessage.includes('Welcome screen')) {
          setFormError(
            rawMessage + '\n\nTap "Login as Organizer" on Welcome.'
          );
        } else {
          setFormError(rawMessage);
        }
      } else {
        setFormError('An unexpected error occurred. Please try again.');
        console.error('Login error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    values,
    touched,
    errors: { ...fieldErrors, form: formError },
    loading,
    isValid,
    onChange,
    onBlur,
    onSubmit,
  };
}
