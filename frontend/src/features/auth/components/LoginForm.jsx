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
import { Ionicons } from '@expo/vector-icons';

import useLoginForm from '@/features/auth/hooks/useLoginForm';
import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import AuthFormScaffold from '@/features/auth/components/AuthFormScaffold';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { authFontAssets, FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';
import { AUTH_FORM_CANVAS } from '@/features/auth/components/welcome/welcomeTheme';

const INPUT_STYLE = {
  borderWidth: 1.5,
  borderColor: 'rgba(255, 123, 63, 0.28)',
  backgroundColor: '#FFFFFF',
};

export default function LoginForm() {
  const router = useGuardedRouter();
  const [fontsLoaded] = useFonts(authFontAssets);
  // TODO: persist "keep me logged in" preference to storage when session management is built
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  const { values, touched, errors, loading, isValid, onChange, onBlur, onSubmit } =
    useLoginForm();

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthFormScaffold welcomeStyle title="Welcome" titleAccent="back">
      <AuthFormMessage message={errors.form} />

      <TextField
        label="Email"
        placeholder="example@gmail.com"
        value={values.email}
        onChangeText={(value) => onChange('email', value)}
        onBlur={() => onBlur('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        error={touched.email ? errors.email : ''}
        inputStyle={INPUT_STYLE}
      />

      <PasswordField
        label="Password"
        placeholder="••••••••"
        value={values.password}
        onChangeText={(value) => onChange('password', value)}
        onBlur={() => onBlur('password')}
        error={touched.password ? errors.password : ''}
        inputStyle={INPUT_STYLE}
      />

      <View style={styles.rowBetween}>
        <Pressable
          style={styles.checkRow}
          onPress={() => setKeepLoggedIn((v) => !v)}
          hitSlop={6}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: keepLoggedIn }}
        >
          <View style={[styles.checkBox, keepLoggedIn && styles.checkBoxChecked]}>
            {keepLoggedIn ? (
              <Ionicons name="checkmark" size={13} color="#fff" />
            ) : null}
          </View>
          <Text style={styles.checkLabel}>Keep me logged in</Text>
        </Pressable>

        {/* TODO: wire up forgot-password flow (send reset link to user email) */}
        <Pressable onPress={() => {}} hitSlop={8}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
      </View>

      <AuthSubmitButton
        onPress={onSubmit}
        disabled={!isValid || loading}
        loading={loading}
        label="Log in"
        loadingLabel="Logging in..."
        style={styles.submitButton}
      />

      <Pressable onPress={() => router.push('/(auth)/login-otp')} style={styles.altLinkRow}>
        <Text style={styles.altLink}>Log in with email code instead</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/signup')} style={styles.signupRow}>
        <Text style={styles.signupText}>
          Don't have an account?{' '}
          <Text style={styles.signupLink}>Sign up</Text>
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkLabel: {
    fontSize: 14,
    color: '#374151',
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONT_JAKARTA_BOLD,
  },
  submitButton: {
    marginBottom: 12,
  },
  altLinkRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  altLink: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: COLORS.primary,
    fontSize: 14,
  },
  signupRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  signupText: {
    textAlign: 'center',
    color: '#5F6B7A',
    fontSize: 15,
    letterSpacing: 0.15,
  },
  signupLink: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: COLORS.primary,
  },
});
