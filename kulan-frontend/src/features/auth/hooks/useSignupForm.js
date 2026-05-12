import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import authApi from '@/api/auth';
import useAuth from '@/auth/useAuth';
import {
  fieldMap,
  getSignupErrors,
  inferFieldErrorsFromMessage,
  normalizeEmail,
} from '@/features/auth/validation/authRules';

export default function useSignupForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [serverErrors, setServerErrors] = useState({});

  const fieldErrors = useMemo(() => getSignupErrors(values), [values]);
  const isValid =
    !fieldErrors.fullName &&
    !fieldErrors.email &&
    !fieldErrors.phone &&
    !fieldErrors.password &&
    !fieldErrors.confirm;

  const onChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (serverErrors[field]) {
      setServerErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onSubmit = async () => {
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirm: true,
    });

    if (!isValid) return;

    setLoading(true);
    setFormError('');
    setServerErrors({});

    try {
      const result = await authApi.register({
        full_name: values.fullName,
        email: normalizeEmail(values.email),
        phone: values.phone,
        password: values.password,
      });

      await login(result.token, result.onboardingCompleted);
      router.replace(
        result.onboardingCompleted ? '/(tabs)/' : '/onboarding/WelcomeIntro',
      );
    } catch (error) {
      let message = 'An error occurred. Please check your network and try again.';
      let fieldErrors = {};

      if (error?.fieldErrors) {
        error.fieldErrors.forEach((err) => {
          if (typeof err === 'string') {
            if (!message || message.startsWith('An error occurred')) {
              message = err;
            }
            return;
          }

          const key = fieldMap[err?.field] || fieldMap[err?.path] || err?.field;
          const errMessage = err?.message || err?.error;
          if (key && errMessage) {
            fieldErrors[key] = errMessage;
          } else if (errMessage) {
            message = errMessage;
          }
        });

        if (Object.keys(fieldErrors).length > 0) {
          setServerErrors(fieldErrors);
          setFormError('');
          console.log('Registration field errors:', fieldErrors);
        } else {
          setFormError(message || 'An unexpected error occurred.');
        }
      } else if (error?.response) {
        const data = error.response.data;
        const normalizeMessage = (value) =>
          typeof value === 'string' ? value.trim() : '';

        if (typeof data === 'string') {
          message = data;
        } else if (Array.isArray(data?.errors)) {
          data.errors.forEach((err) => {
            if (typeof err === 'string') {
              if (!message || message.startsWith('An error occurred')) {
                message = err;
              }
              return;
            }

            const key = fieldMap[err?.field] || fieldMap[err?.path];
            const errMessage = err?.message || err?.error;
            if (key && errMessage) {
              fieldErrors[key] = errMessage;
            } else if (errMessage) {
              message = errMessage;
            }
          });
        } else if (data?.field && data?.message) {
          const key = fieldMap[data.field] || data.field;
          fieldErrors[key] = data.message;
        } else if (data?.message) {
          message = data.message;
        } else if (data?.error) {
          message = data.error;
        } else {
          message = `Request failed with status ${error.response.status}.`;
        }

        if (Object.keys(fieldErrors).length === 0) {
          fieldErrors = inferFieldErrorsFromMessage(normalizeMessage(message));
        }

        if (Object.keys(fieldErrors).length > 0) {
          setServerErrors(fieldErrors);
          setFormError('');
        } else {
          setFormError(message || 'An unexpected error occurred.');
        }

        console.log('Registration error:', error?.response?.data || error);
      } else if (error?.message) {
        setFormError(error.message);
      } else {
        setFormError(message || 'An unexpected error occurred.');
        console.log('Registration error:', error);
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
