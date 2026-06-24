import { useMemo, useState } from 'react';
import useGuardedRouter from '@/hooks/useGuardedRouter';

import api from '@/api/auth';
import useAuth from '@/auth/useAuth';
import {
  getInvalidCredentialsErrors,
  getLoginErrors,
  isInvalidCredentialsMessage,
  normalizeEmail,
} from '@/features/auth/validation/authRules';

export default function useLoginForm() {
  const router = useGuardedRouter();
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
      const rawMessage =
        (error.response && error.response.status === 401
          ? error.response.data?.message
          : null) ||
        error.message ||
        'Invalid email or password. Please try again.';

      if (isInvalidCredentialsMessage(rawMessage)) {
        const invalidErrors = getInvalidCredentialsErrors();
        setServerErrors({ email: invalidErrors.email, password: invalidErrors.password });
        setFormError(invalidErrors.form);
      } else if (error.response || error.message) {
        setFormError(rawMessage);
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
