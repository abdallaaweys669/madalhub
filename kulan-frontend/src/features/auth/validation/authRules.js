export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const strongPassword = (value) =>
  /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && value.length >= 8;

export const getLoginErrors = ({ email, password }) => {
  const emailError = !email
    ? 'Email is required.'
    : !emailRegex.test(email)
    ? 'Enter a valid email address.'
    : '';

  const passwordError = !password
    ? 'Password is required.'
    : password.length < 6
    ? 'Password must be at least 6 characters.'
    : '';

  return { email: emailError, password: passwordError };
};

export const getSignupErrors = ({ fullName, email, phone, password, confirm }) => {
  const nameError = !fullName.trim()
    ? 'Full name is required.'
    : fullName.trim().length < 2
    ? 'Please enter at least 2 characters.'
    : '';

  const emailError = !email
    ? 'Email is required.'
    : !emailRegex.test(email)
    ? 'Enter a valid email address.'
    : '';

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
