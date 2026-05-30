import { useCallback, useMemo, useState } from 'react';

import {
  getAuthSignupErrors,
  getConfirmPasswordDisplayError,
  getPasswordChecks,
} from '@/features/auth/validation/authRules';

const INITIAL_VALUES = {
  member: {
    fullName: '',
    email: '',
    password: '',
    confirm: '',
  },
  organizer: {
    organizationName: '',
    email: '',
    password: '',
    confirm: '',
  },
};

const TOUCHED_KEYS = {
  member: ['fullName', 'email', 'password', 'confirm'],
  organizer: ['organizationName', 'email', 'password', 'confirm'],
};

function buildTouchedRecord(variant, value = false) {
  return TOUCHED_KEYS[variant].reduce((acc, key) => {
    acc[key] = value;
    return acc;
  }, {});
}

export default function useAuthSignupForm(variant = 'member') {
  const [values, setValues] = useState(INITIAL_VALUES[variant]);
  const [touched, setTouched] = useState(() => buildTouchedRecord(variant, false));
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const fieldErrors = useMemo(
    () => getAuthSignupErrors(values, variant),
    [values, variant],
  );

  const passwordChecks = useMemo(
    () => getPasswordChecks(values.password),
    [values.password],
  );

  const isValid = useMemo(
    () => Object.values(fieldErrors).every((message) => !message),
    [fieldErrors],
  );

  const shouldShowError = useCallback(
    (field) => touched[field] || submitted,
    [touched, submitted],
  );

  const getDisplayError = useCallback(
    (field) => {
      if (serverErrors[field]) return serverErrors[field];

      if (field === 'confirm') {
        const showConfirm =
          values.confirm.length > 0 || touched.confirm || submitted;
        if (!showConfirm) return '';
        return getConfirmPasswordDisplayError(values.password, values.confirm, {
          submitted,
        });
      }

      if (!shouldShowError(field)) return '';
      return fieldErrors[field] || '';
    },
    [shouldShowError, serverErrors, fieldErrors, values.password, values.confirm, submitted, touched.confirm],
  );

  const showPasswordChecklist =
    values.password.length > 0 || touched.password || submitted;

  const onChange = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setServerErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  }, []);

  const onBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const markAllTouched = useCallback(() => {
    setTouched(buildTouchedRecord(variant, true));
    setSubmitted(true);
  }, [variant]);

  const clearServerErrors = useCallback(() => {
    setServerErrors({});
  }, []);

  const applyServerErrors = useCallback((errors = {}) => {
    setServerErrors(errors);
  }, []);

  return {
    values,
    touched,
    submitted,
    fieldErrors,
    passwordChecks,
    showPasswordChecklist,
    isValid,
    serverErrors,
    getDisplayError,
    shouldShowError,
    onChange,
    onBlur,
    markAllTouched,
    clearServerErrors,
    applyServerErrors,
  };
}
