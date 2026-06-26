import React from 'react';

import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import PasswordRequirements from '@/features/auth/components/PasswordRequirements';

const PASSWORD_INPUT_STYLE = {
  borderWidth: 1.5,
  borderColor: 'rgba(255, 123, 63, 0.28)',
  backgroundColor: '#FFFFFF',
};

export default function SignupFormFields({
  variant = 'member',
  values,
  getDisplayError,
  showPasswordChecklist,
  passwordChecks,
  onChange,
  onBlur,
}) {
  const isOrganizer = variant === 'organizer';
  const nameField = isOrganizer ? 'organizationName' : 'fullName';
  const nameLabel = isOrganizer ? 'Organization Name' : 'Full Name';
  const namePlaceholder = isOrganizer
    ? 'Enter organization name'
    : 'Enter your full name';

  return (
    <>
      <TextField
        label={nameLabel}
        value={values[nameField]}
        onChangeText={(value) => onChange(nameField, value)}
        onBlur={() => onBlur(nameField)}
        error={getDisplayError(nameField)}
        placeholder={namePlaceholder}
        autoCapitalize="words"
      />

      <TextField
        label="Email"
        value={values.email}
        onChangeText={(value) => onChange('email', value)}
        onBlur={() => onBlur('email')}
        error={getDisplayError('email')}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
      />

      <PasswordField
        label="Password"
        value={values.password}
        onChangeText={(value) => onChange('password', value)}
        onBlur={() => onBlur('password')}
        error={getDisplayError('password')}
        placeholder="Create password"
        inputStyle={PASSWORD_INPUT_STYLE}
        showLeadingLock
      />
      {showPasswordChecklist ? <PasswordRequirements checks={passwordChecks} /> : null}

      <PasswordField
        label="Confirm Password"
        value={values.confirm}
        onChangeText={(value) => onChange('confirm', value)}
        onBlur={() => onBlur('confirm')}
        error={getDisplayError('confirm')}
        placeholder="Confirm password"
        inputStyle={PASSWORD_INPUT_STYLE}
      />
    </>
  );
}
