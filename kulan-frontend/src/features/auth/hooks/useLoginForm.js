import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import api from '@/api/auth';
import useAuth from '@/auth/useAuth';
import {
  getInvalidCredentialsErrors,
  getLoginErrors,
  isInvalidCredentialsMessage,
  normalizeEmail,
} from '@/features/auth/validation/authRules';

export default function useLoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [serverErrors, setServerErrors] = useState({});

  const fieldErrors = useMemo(() => getLoginErrors(values), [values]);
  const isValid = !fieldErrors.email && !fieldErrors.password;

  const onChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (serverErrors[field]) {
      setServerErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (formError) setFormError('');
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onSubmit = async () => {
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setLoading(true);
    setFormError('');
    setServerErrors({});

    try {
      const result = await api.login({
        ...values,
        email: normalizeEmail(values.email),
      });

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
        } else if (isInvalidCredentialsMessage(rawMessage)) {
          const invalidErrors = getInvalidCredentialsErrors();
          setServerErrors({ email: invalidErrors.email, password: invalidErrors.password });
          setFormError(invalidErrors.form);
        } else {
          setFormError(rawMessage);
        }
      } else if (error.message) {
        const rawMessage = error.message;
        if (rawMessage.includes('organizer login') || rawMessage.includes('Welcome screen')) {
          setFormError(
            rawMessage + '\n\nTap "Login as Organizer" on Welcome.'
          );
        } else if (isInvalidCredentialsMessage(rawMessage)) {
          const invalidErrors = getInvalidCredentialsErrors();
          setServerErrors({ email: invalidErrors.email, password: invalidErrors.password });
          setFormError(invalidErrors.form);
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
    errors: { ...fieldErrors, ...serverErrors, form: formError },
    loading,
    isValid,
    onChange,
    onBlur,
    onSubmit,
  };
}
