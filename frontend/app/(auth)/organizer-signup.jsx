import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useFonts } from 'expo-font';

import { COLORS } from '@/constants/loginSignin/authStyles';
import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import AuthFormScaffold from '@/features/auth/components/AuthFormScaffold';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import SignupFormFields from '@/features/auth/components/SignupFormFields';
import SignupLegalBlock from '@/features/auth/components/SignupLegalBlock';
import useOrganizerSignupForm from '@/features/auth/hooks/useOrganizerSignupForm';
import { authFontAssets, FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';
import { AUTH_FORM_CANVAS } from '@/features/auth/components/welcome/welcomeTheme';

export default function OrganizerSignupScreen() {
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
    formError,
  } = useOrganizerSignupForm();

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
    <AuthFormScaffold welcomeStyle title="Start" titleAccent="organizing">
      <AuthFormMessage message={formError} />

      <SignupFormFields
        variant="organizer"
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
        disabled={!isValid || loading}
        loading={loading}
        label="Create account"
        style={styles.submitButton}
      />

      <Pressable
        onPress={() => router.push('/(auth)/organizer-login')}
        style={styles.footerRow}
      >
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.footerLink}>Log in</Text>
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
  footerRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  footerText: {
    textAlign: 'center',
    color: '#5F6B7A',
    fontSize: 15,
    letterSpacing: 0.15,
  },
  footerLink: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: COLORS.primary,
  },
});
