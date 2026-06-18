import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { useLocalSearchParams } from 'expo-router';

import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import AuthFormScaffold from '@/features/auth/components/AuthFormScaffold';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import OtpCodeInput from '@/features/auth/components/OtpCodeInput';
import useOtpVerify from '@/features/auth/hooks/useOtpVerify';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { authFontAssets, FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';
import { AUTH_FORM_CANVAS } from '@/features/auth/components/welcome/welcomeTheme';

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams();
  const purpose = params.purpose === 'signup' ? 'signup' : 'login';
  const emailParam = typeof params.email === 'string' ? params.email : '';

  const [fontsLoaded] = useFonts(authFontAssets);
  const {
    email,
    code,
    setCode,
    codeError,
    isValid,
    loading,
    resending,
    cooldown,
    formError,
    resend,
    verify,
  } = useOtpVerify({ purpose, email: emailParam });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthFormScaffold welcomeStyle title="Check your" titleAccent="email">
      <Text style={styles.subtitle}>
        We sent a 6-digit code to{'\n'}
        <Text style={styles.email}>{email || 'your email'}</Text>
      </Text>

      <AuthFormMessage message={formError} />

      <OtpCodeInput value={code} onChange={setCode} disabled={loading} />
      {code.length === 6 && codeError ? (
        <Text style={styles.fieldError}>{codeError}</Text>
      ) : null}

      <AuthSubmitButton
        onPress={verify}
        disabled={!isValid || loading}
        loading={loading}
        label="Verify and continue"
        loadingLabel="Verifying..."
        style={styles.submitButton}
      />

      <Pressable
        onPress={resend}
        disabled={cooldown > 0 || resending}
        style={styles.resendRow}
      >
        <Text style={[styles.resendText, (cooldown > 0 || resending) && styles.resendMuted]}>
          {cooldown > 0
            ? `Resend code in ${cooldown}s`
            : resending
              ? 'Sending...'
              : 'Resend code'}
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
    marginBottom: 24,
  },
  email: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: '#374151',
  },
  fieldError: {
    marginTop: 8,
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  resendText: {
    color: COLORS.primary,
    fontFamily: FONT_JAKARTA_BOLD,
    fontSize: 15,
  },
  resendMuted: {
    color: '#9CA3AF',
  },
});
