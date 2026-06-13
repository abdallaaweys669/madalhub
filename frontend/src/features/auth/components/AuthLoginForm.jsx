import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import AuthKeepLoggedIn from '@/features/auth/components/AuthKeepLoggedIn';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import AuthFooterLink from '@/features/auth/components/AuthFooterLink';

/**
 * Shared login form body used by both the member and organizer login screens.
 *
 * The caller is responsible for computing a unified `errors` object with the
 * shape `{ email, password, form }` before passing it in (e.g. merging server
 * errors with field validation errors for the organizer screen).
 */
export default function AuthLoginForm({
  values,
  touched,
  errors,
  loading,
  isValid,
  onChange,
  onBlur,
  onSubmit,
  footerText,
  footerLinkLabel,
  onFooterPress,
  submitLabel = 'Log in',
  loadingLabel,
}) {
  // TODO: persist "keep me logged in" preference to storage when session management is built
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  return (
    <>
      <AuthFormMessage message={errors.form} />

      <TextField
        underline
        label="Email"
        placeholder="your@email.com"
        value={values.email}
        onChangeText={(value) => onChange('email', value)}
        onBlur={() => onBlur('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        error={touched.email ? errors.email : ''}
      />

      <PasswordField
        underline
        label="Password"
        placeholder="••••••••"
        value={values.password}
        onChangeText={(value) => onChange('password', value)}
        onBlur={() => onBlur('password')}
        error={touched.password ? errors.password : ''}
      />

      <AuthKeepLoggedIn
        checked={keepLoggedIn}
        onToggle={() => setKeepLoggedIn((v) => !v)}
      />

      <AuthSubmitButton
        onPress={onSubmit}
        disabled={!isValid || loading}
        loading={loading}
        label={submitLabel}
        loadingLabel={loadingLabel}
        style={styles.submitButton}
      />

      <AuthFooterLink
        text={footerText}
        linkLabel={footerLinkLabel}
        onPress={onFooterPress}
      />
    </>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    marginBottom: 18,
  },
});
