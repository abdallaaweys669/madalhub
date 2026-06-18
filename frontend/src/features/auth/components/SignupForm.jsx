import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useFonts } from 'expo-font';

import useSignupForm from '@/features/auth/hooks/useSignupForm';
import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import AuthFormScaffold from '@/features/auth/components/AuthFormScaffold';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import SignupFormFields from '@/features/auth/components/SignupFormFields';
import SignupLegalBlock from '@/features/auth/components/SignupLegalBlock';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { authFontAssets, FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';
import { AUTH_FORM_CANVAS } from '@/features/auth/components/welcome/welcomeTheme';

export default function SignupForm() {
  const router = useGuardedRouter();
  const [fontsLoaded] = useFonts(authFontAssets);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalAttempted, setLegalAttempted] = useState(false);

  const {
    values,
    getDisplayError,
    showPasswordChecklist,
    passwordChecks,
    loading,
    isValid,
    onChange,
    onBlur,
    onSubmit,
    errors,
  } = useSignupForm();

  const legalValid = ageConfirmed && termsAccepted;

  const handleSubmit = () => {
    setLegalAttempted(true);
    if (!legalValid) return;
    onSubmit();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthFormScaffold welcomeStyle title="Create your" titleAccent="account">
      <AuthFormMessage message={errors.form} />

      <SignupFormFields
        variant="member"
        values={values}
        password={values.password}
        getDisplayError={getDisplayError}
        showPasswordChecklist={showPasswordChecklist}
        passwordChecks={passwordChecks}
        onChange={onChange}
        onBlur={onBlur}
      />

      <SignupLegalBlock
        ageConfirmed={ageConfirmed}
        termsAccepted={termsAccepted}
        onToggleAge={() => setAgeConfirmed((v) => !v)}
        onToggleTerms={() => setTermsAccepted((v) => !v)}
        showErrors={legalAttempted}
      />

      <AuthSubmitButton
        onPress={handleSubmit}
        disabled={loading}
        loading={loading}
        label="Create account"
        loadingLabel="Creating account..."
        style={styles.submitButton}
      />

      <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginRow}>
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLink}>Log in</Text>
        </Text>
      </Pressable>
    </AuthFormScaffold>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AUTH_FORM_CANVAS,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 18,
  },
  loginRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  loginText: {
    textAlign: 'center',
    color: '#5F6B7A',
    fontSize: 15,
    letterSpacing: 0.15,
  },
  loginLink: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: COLORS.primary,
  },
});
