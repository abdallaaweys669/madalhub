export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 60;
export const PASSWORD_MIN_LENGTH = 8;

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\s'-]+$/;

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const normalizePersonName = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

export const getPersonNameError = (value, { label = 'Name' } = {}) => {
  const name = normalizePersonName(value);
  if (!name) return `${label} is required.`;
  if (name.length < NAME_MIN_LENGTH) {
    return `Use at least ${NAME_MIN_LENGTH} characters.`;
  }
  if (name.length > NAME_MAX_LENGTH) {
    return `Keep it under ${NAME_MAX_LENGTH} characters.`;
  }
  if (!NAME_PATTERN.test(name)) {
    return 'Use letters, spaces, hyphens, or apostrophes only.';
  }
  return '';
};

export const getFullNameError = (value) =>
  getPersonNameError(value, { label: 'Full name' });

export const getOrganizationNameError = (value) =>
  getPersonNameError(value, { label: 'Organization name' });

export const getEmailError = (value) => {
  const email = normalizeEmail(value);
  if (!email) return 'Email is required.';
  if (email.includes(' ')) return 'Remove spaces from your email.';
  if (!email.includes('@')) return 'Include @ in your email (e.g. name@example.com).';
  if (!emailRegex.test(email)) return 'Enter a valid email (e.g. name@example.com).';
  const [, domain] = email.split('@');
  if (!domain?.includes('.')) return 'Email domain looks incomplete.';
  return '';
};

export const getPasswordChecks = (value = '') => ({
  length: value.length >= PASSWORD_MIN_LENGTH,
  upper: /[A-Z]/.test(value),
  lower: /[a-z]/.test(value),
  number: /\d/.test(value),
});

export const isStrongPassword = (value) => {
  const checks = getPasswordChecks(value);
  return checks.length && checks.upper && checks.lower && checks.number;
};

/** @deprecated use isStrongPassword */
export const strongPassword = isStrongPassword;

export const getPasswordError = (value) => {
  if (!value) return 'Password is required.';
  const checks = getPasswordChecks(value);
  if (!checks.length) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!checks.upper) return 'Add an uppercase letter (A–Z).';
  if (!checks.lower) return 'Add a lowercase letter (a–z).';
  if (!checks.number) return 'Add a number (0–9).';
  return '';
};

export const CONFIRM_PASSWORD_MISMATCH = 'Passwords do not match.';
export const CONFIRM_PASSWORD_REQUIRED = 'Please confirm your password.';

/** @param {{ requireFilled?: boolean }} options */
export const getConfirmPasswordError = (password, confirm, options = {}) => {
  const { requireFilled = true } = options;
  if (!confirm) {
    return requireFilled ? CONFIRM_PASSWORD_REQUIRED : '';
  }
  if (confirm !== password) return CONFIRM_PASSWORD_MISMATCH;
  return '';
};

/** Shown under the field while the user is typing (no empty-state nag). */
export const getConfirmPasswordDisplayError = (password, confirm, { submitted = false } = {}) => {
  if (!confirm) {
    return submitted ? CONFIRM_PASSWORD_REQUIRED : '';
  }
  if (confirm !== password) return CONFIRM_PASSWORD_MISMATCH;
  return '';
};

export const getAuthSignupErrors = (values, variant = 'member') => {
  const errors =
    variant === 'organizer'
      ? {
          organizationName: getOrganizationNameError(values.organizationName),
          email: getEmailError(values.email),
          password: getPasswordError(values.password),
          confirm: getConfirmPasswordError(values.password, values.confirm),
        }
      : {
          fullName: getFullNameError(values.fullName),
          email: getEmailError(values.email),
          password: getPasswordError(values.password),
          confirm: getConfirmPasswordError(values.password, values.confirm),
        };

  return errors;
};

export const getSignupErrors = (values) => getAuthSignupErrors(values, 'member');

export const getOrganizerSignupErrors = (values) =>
  getAuthSignupErrors(values, 'organizer');

export const getLoginErrors = ({ email, password }) => {
  const emailError = getEmailError(email);
  const passwordError = !password
    ? 'Password is required.'
    : password.length < 6
    ? 'Password looks too short. Check it and try again.'
    : '';

  return { email: emailError, password: passwordError };
};

export const getInvalidCredentialsErrors = () => ({
  email: 'Check that this is the email for your account.',
  password: 'Check your password. Passwords are case-sensitive.',
  form: "We couldn't sign you in. Review the highlighted fields and try again.",
});

export const isInvalidCredentialsMessage = (message) => {
  const normalized = String(message || '').toLowerCase();
  return (
    normalized.includes('invalid') ||
    normalized.includes('wrong') ||
    normalized.includes('incorrect') ||
    normalized.includes('unauthorized')
  );
};

export const fieldMap = {
  full_name: 'fullName',
  fullName: 'fullName',
  organization_name: 'organizationName',
  organizationName: 'organizationName',
  email: 'email',
  phone: 'phone',
  phone_number: 'phone',
  password: 'password',
  confirm_password: 'confirm',
  confirm: 'confirm',
};

export const inferFieldErrorsFromMessage = (message) => {
  const normalized = String(message || '').toLowerCase();
  const errors = {};
  if (normalized.includes('email')) errors.email = message;
  if (normalized.includes('phone')) errors.phone = message;
  if (normalized.includes('password')) errors.password = message;
  if (normalized.includes('organization') || normalized.includes('full name')) {
    errors.organizationName = message;
    errors.fullName = message;
  }
  return errors;
};

export function parseAuthApiFieldErrors(error) {
  let message = 'An error occurred. Please check your network and try again.';
  const fieldErrors = {};

  const assignField = (key, errMessage) => {
    const mapped = fieldMap[key] || key;
    if (mapped && errMessage) fieldErrors[mapped] = errMessage;
  };

  if (error?.fieldErrors) {
    error.fieldErrors.forEach((err) => {
      if (typeof err === 'string') {
        if (!message || message.startsWith('An error occurred')) message = err;
        return;
      }
      const key = fieldMap[err?.field] || fieldMap[err?.path] || err?.field;
      const errMessage = err?.message || err?.error;
      if (key && errMessage) assignField(key, errMessage);
      else if (errMessage) message = errMessage;
    });
    return { fieldErrors, message };
  }

  if (error?.response) {
    const data = error.response.data;
    const normalizeMessage = (value) => (typeof value === 'string' ? value.trim() : '');

    if (typeof data === 'string') {
      message = data;
    } else if (Array.isArray(data?.errors)) {
      data.errors.forEach((err) => {
        if (typeof err === 'string') {
          if (!message || message.startsWith('An error occurred')) message = err;
          return;
        }
        const key = fieldMap[err?.field] || fieldMap[err?.path];
        const errMessage = err?.message || err?.error;
        if (key && errMessage) assignField(key, errMessage);
        else if (errMessage) message = errMessage;
      });
    } else if (data?.field && data?.message) {
      assignField(data.field, data.message);
    } else if (data?.message) {
      message = data.message;
    } else if (data?.error) {
      message = data.error;
    } else {
      message = `Request failed with status ${error.response.status}.`;
    }

    if (Object.keys(fieldErrors).length === 0) {
      Object.assign(fieldErrors, inferFieldErrorsFromMessage(normalizeMessage(message)));
    }

    return { fieldErrors, message };
  }

  if (error?.message) {
    return { fieldErrors: inferFieldErrorsFromMessage(error.message), message: error.message };
  }

  return { fieldErrors, message };
}

export const getSignupPayload = (values, variant = 'member') => {
  const name =
    variant === 'organizer'
      ? normalizePersonName(values.organizationName)
      : normalizePersonName(values.fullName);

  return {
    full_name: name,
    email: normalizeEmail(values.email),
    password: values.password,
  };
};

export const getOtpCodeError = (value) => {
  const code = String(value || '').trim();
  if (!code) return 'Enter the 6-digit code from your email.';
  if (!/^\d{6}$/.test(code)) return 'Code must be exactly 6 digits.';
  return '';
};

export const parseOtpApiMessage = (error) => {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.';

  if (status === 429) {
    return message;
  }
  if (status === 401) {
    return message;
  }
  return message;
};
