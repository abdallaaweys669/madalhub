export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const getEmailError = (value) => {
  const email = normalizeEmail(value);
  if (!email) return 'Email is required.';
  if (email.includes(' ')) return 'Email cannot contain spaces. Use something like name@example.com.';
  if (!email.includes('@')) return 'Enter a valid email address, for example name@example.com.';
  if (!emailRegex.test(email)) return 'Enter a valid email address, for example name@example.com.';
  return '';
};

export const strongPassword = (value) =>
  /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && value.length >= 8;

export const getLoginErrors = ({ email, password }) => {
  const emailError = getEmailError(email);
  const passwordError = !password
    ? 'Password is required.'
    : password.length < 6
    ? 'Password looks too short. Check it and try again.'
    : '';

  return { email: emailError, password: passwordError };
};

export const getSignupErrors = ({ fullName, email, phone, password, confirm }) => {
  const nameError = !fullName.trim()
    ? 'Full name is required.'
    : fullName.trim().length < 2
    ? 'Please enter at least 2 characters.'
    : '';

  const emailError = getEmailError(email);

  const phoneError = !phone
    ? 'Phone number is required.'
    : phone.length < 9
    ? 'Enter a valid phone number.'
    : '';

  const passwordError = !password
    ? 'Password is required.'
    : !strongPassword(password)
    ? 'Use at least 8 chars with upper, lower & a number.'
    : '';

  const confirmError = !confirm
    ? 'Please confirm your password.'
    : confirm !== password
    ? 'Passwords do not match.'
    : '';

  return {
    fullName: nameError,
    email: emailError,
    phone: phoneError,
    password: passwordError,
    confirm: confirmError,
  };
};

export const getOrganizerSignupErrors = ({ organizationName, email, password, confirm }) => {
  const organizationNameError = !organizationName.trim()
    ? 'Organization name is required.'
    : organizationName.trim().length < 2
    ? 'Please enter at least 2 characters.'
    : '';

  const passwordError = !password
    ? 'Password is required.'
    : !strongPassword(password)
    ? 'Use at least 8 chars with upper, lower & a number.'
    : '';

  const confirmError = !confirm
    ? 'Please confirm your password.'
    : confirm !== password
    ? 'Passwords do not match.'
    : '';

  return {
    organizationName: organizationNameError,
    email: getEmailError(email),
    password: passwordError,
    confirm: confirmError,
  };
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
  return errors;
};
