import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import useGuardedRouter from '@/hooks/useGuardedRouter';

import useOtpLoginForm from '@/features/auth/hooks/useOtpLoginForm';
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

export default function LoginOtpScreen() {
  const router = useGuardedRouter();
  const [fontsLoaded] = useFonts(authFontAssets);
  const {
    email,
    setEmail,
    touched,
    emailError,
    loading,
    isValid,
    formError,
    onBlur,
    onSubmit,
  } = useOtpLoginForm();

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthFormScaffold welcomeStyle title="Login with" titleAccent="email code">
      <Text style={styles.subtitle}>We&apos;ll email you a 6-digit code to sign in.</Text>

      <AuthFormMessage message={formError} />

      <TextField
        label="Email"
        placeholder="example@gmail.com"
        value={email}
        onChangeText={setEmail}
        onBlur={onBlur}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        error={touched ? emailError : ''}
        inputStyle={INPUT_STYLE}
      />

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
          Prefer password? <Text style={styles.backLink}>Back to login</Text>
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
  submitButton: {
    marginTop: 8,
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
