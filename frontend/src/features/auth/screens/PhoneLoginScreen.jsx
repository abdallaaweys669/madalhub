import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import useGuardedRouter from '@/hooks/useGuardedRouter';

import useClerkPhoneLogin from '@/features/auth/hooks/useClerkPhoneLogin';
import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import AuthFormScaffold from '@/features/auth/components/AuthFormScaffold';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import TextField from '@/features/auth/components/TextField';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { authFontAssets, FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';
import { AUTH_FORM_CANVAS } from '@/features/auth/components/welcome/welcomeTheme';

const INPUT_STYLE = {
  borderWidth: 1.5,
  borderColor: 'rgba(255, 123, 63, 0.28)',
  backgroundColor: '#FFFFFF',
};

export default function PhoneLoginScreen() {
  const router = useGuardedRouter();
  const [fontsLoaded] = useFonts(authFontAssets);
  const {
    phone,
    setPhone,
    touched,
    phoneError,
    loading,
    isValid,
    formError,
    onBlur,
    onSubmit,
  } = useClerkPhoneLogin();

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthFormScaffold welcomeStyle title="Login with" titleAccent="phone">
      <Text style={styles.subtitle}>
        We&apos;ll send a 6-digit code to your phone number.
      </Text>

      <AuthFormMessage message={formError} />

      <TextField
        label="Phone number"
        placeholder="+252 61 234 5678"
        value={phone}
        onChangeText={setPhone}
        onBlur={onBlur}
        keyboardType="phone-pad"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="telephoneNumber"
        error={touched ? phoneError : ''}
        inputStyle={INPUT_STYLE}
      />

      <Text style={styles.hint}>Include your country code, e.g. +252 for Somalia.</Text>

      <AuthSubmitButton
        onPress={onSubmit}
        disabled={!isValid || loading}
        loading={loading}
        label="Send code"
        loadingLabel="Sending..."
        style={styles.submitButton}
      />

      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Text style={styles.backText}>
          Prefer email?{' '}
          <Text style={styles.backLink}>Back to login</Text>
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
  subtitle: {
    textAlign: 'center',
    color: '#5F6B7A',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 12,
    marginBottom: 18,
  },
  backRow: {
    alignItems: 'center',
  },
  backText: {
    color: '#5F6B7A',
    fontSize: 15,
  },
  backLink: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: COLORS.primary,
  },
});
