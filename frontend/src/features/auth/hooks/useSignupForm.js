import { useState } from 'react';
import useGuardedRouter from '@/hooks/useGuardedRouter';

import authApi from '@/api/auth';
import useAuth from '@/auth/useAuth';
import useAuthSignupForm from '@/features/auth/hooks/useAuthSignupForm';
import {
  getSignupPayload,
  parseAuthApiFieldErrors,
} from '@/features/auth/validation/authRules';

export default function useSignupForm() {
  const router = useGuardedRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const form = useAuthSignupForm('member');

  const onSubmit = async () => {
    form.markAllTouched();
    if (!form.isValid) return;

    setLoading(true);
    setFormError('');
    form.clearServerErrors();

    try {
      const result = await authApi.register(getSignupPayload(form.values, 'member'));

      await login(result.token, result.onboardingCompleted);
      router.replace(
        result.onboardingCompleted ? '/(tabs)/' : '/onboarding/WelcomeIntro',
      );
    } catch (error) {
      const { fieldErrors, message } = parseAuthApiFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        form.applyServerErrors(fieldErrors);
        setFormError('');
      } else {
        setFormError(message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    values: form.values,
    touched: form.touched,
    passwordChecks: form.passwordChecks,
    showPasswordChecklist: form.showPasswordChecklist,
    getDisplayError: form.getDisplayError,
    loading,
    isValid: form.isValid,
    onChange: form.onChange,
    onBlur: form.onBlur,
    onSubmit,
    errors: { form: formError },
  };
}
