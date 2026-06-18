import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/loginSignin/authStyles';
import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import AuthFormScaffold from '@/features/auth/components/AuthFormScaffold';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { getOrganizerEntryHref } from '@/navigation/organizerGate';
import {
  getInvalidCredentialsErrors,
  getLoginErrors,
  isInvalidCredentialsMessage,
  normalizeEmail,
} from '@/features/auth/validation/authRules';
import { authFontAssets, FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';
import { AUTH_FORM_CANVAS } from '@/features/auth/components/welcome/welcomeTheme';

const INPUT_STYLE = {
  borderWidth: 1.5,
  borderColor: 'rgba(255, 123, 63, 0.28)',
  backgroundColor: '#FFFFFF',
};

export default function OrganizerLoginScreen() {
  const router = useGuardedRouter();
  const { loginAsOrganizer } = useAuth();
  const [fontsLoaded] = useFonts(authFontAssets);

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [serverErrors, setServerErrors] = useState({});
  // TODO: persist "keep me logged in" preference to storage when session management is built
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  const fieldErrors = useMemo(() => getLoginErrors(values), [values]);
  const isValid = !fieldErrors.email && !fieldErrors.password;

  const onChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (serverErrors[field]) setServerErrors((prev) => ({ ...prev, [field]: '' }));
    if (formError) setFormError('');
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const routeOrganizerAfterLogin = async (result) => {
    await loginAsOrganizer(result.token, result.organizerStatus, result.rejectionReason);
    router.replace(getOrganizerEntryHref(result.organizerStatus));
  };

  const onSubmit = async () => {
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setLoading(true);
    setFormError('');
    setServerErrors({});

    try {
      const result = await organizerApi.organizerLogin({
        ...values,
        email: normalizeEmail(values.email),
      });
      await routeOrganizerAfterLogin(result);
    } catch (error) {
      const message = error.message || 'Login failed. Please try again.';
      if (isInvalidCredentialsMessage(message)) {
        const invalidErrors = getInvalidCredentialsErrors();
        setServerErrors({ email: invalidErrors.email, password: invalidErrors.password });
        setFormError(invalidErrors.form);
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthFormScaffold welcomeStyle title="Organizer" titleAccent="sign in">
      <AuthFormMessage message={formError} />

      <TextField
        label="Email"
        placeholder="organizer@example.com"
        value={values.email}
        onChangeText={(v) => onChange('email', v)}
        onBlur={() => onBlur('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        error={touched.email ? serverErrors.email || fieldErrors.email : ''}
        inputStyle={INPUT_STYLE}
      />

      <PasswordField
        label="Password"
        placeholder="••••••••"
        value={values.password}
        onChangeText={(v) => onChange('password', v)}
        onBlur={() => onBlur('password')}
        error={touched.password ? serverErrors.password || fieldErrors.password : ''}
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
            {keepLoggedIn ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
          </View>
          <Text style={styles.checkLabel}>Keep me logged in</Text>
        </Pressable>

        {/* TODO: wire up forgot-password flow (send reset link to organizer email) */}
        <Pressable onPress={() => {}} hitSlop={8}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
      </View>

      <AuthSubmitButton
        onPress={onSubmit}
        disabled={!isValid || loading}
        loading={loading}
        label="Log in"
        loadingLabel="Signing in..."
        style={styles.submitButton}
      />

      <Pressable
        onPress={() => router.push('/(auth)/organizer-signup')}
        style={styles.footerRow}
      >
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Text style={styles.footerLink}>Sign up</Text>
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
