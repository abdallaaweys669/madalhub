import { useState } from 'react';
import useGuardedRouter from '@/hooks/useGuardedRouter';

import organizerApi from '@/api/organizer';
import useAuth from '@/auth/useAuth';
import useAuthSignupForm from '@/features/auth/hooks/useAuthSignupForm';
import { isOrganizerSubmissionReadyForReview } from '@/utils/organizerVerification';
import {
  getSignupPayload,
  inferFieldErrorsFromMessage,
  normalizePersonName,
} from '@/features/auth/validation/authRules';

export default function useOrganizerSignupForm() {
  const router = useGuardedRouter();
  const { loginAsOrganizer } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const form = useAuthSignupForm('organizer');

  const routeOrganizerAfterLogin = async (result) => {
    await loginAsOrganizer(result.token, result.organizerStatus, result.rejectionReason);
    if (result.organizerStatus === 'approved') {
      router.replace('/(organizer)/dashboard');
      return;
    }
    if (result.organizerStatus === 'rejected') {
      router.replace('/(organizer-status)/verification-failed');
      return;
    }
    const detail = await organizerApi.getOrganizerStatus();
    const ready = isOrganizerSubmissionReadyForReview(detail);
    router.replace(
      ready ? '/(organizer-status)/pending-verification' : '/(organizer-status)/resubmit-verification',
    );
  };

  const onSubmit = async () => {
    form.markAllTouched();
    if (!form.isValid) return;

    setLoading(true);
    setFormError('');
    form.clearServerErrors();

    try {
      const payload = getSignupPayload(form.values, 'organizer');
      await organizerApi.organizerRegister(payload);

      const result = await organizerApi.organizerLogin({
        email: payload.email,
        password: payload.password,
      });

      await routeOrganizerAfterLogin(result);
    } catch (error) {
      const message = error?.message || 'Registration failed. Please try again.';
      const inferredErrors = inferFieldErrorsFromMessage(message);
      if (Object.keys(inferredErrors).length > 0) {
        form.applyServerErrors(inferredErrors);
        setFormError('');
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    values: form.values,
    passwordChecks: form.passwordChecks,
    showPasswordChecklist: form.showPasswordChecklist,
    getDisplayError: form.getDisplayError,
    loading,
    isValid: form.isValid,
    onChange: form.onChange,
    onBlur: form.onBlur,
    onSubmit,
    formError,
    routeOrganizerAfterLogin,
    organizerEmail: form.values.email,
    organizerName: normalizePersonName(form.values.organizationName),
    setFormError,
    clearServerErrors: form.clearServerErrors,
  };
}
