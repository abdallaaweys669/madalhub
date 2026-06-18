import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useFonts } from 'expo-font';

import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import AuthFormScaffold from '@/features/auth/components/AuthFormScaffold';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import useAuth from '@/auth/useAuth';
import authApi from '@/api/auth';
import { jwtDecode } from 'jwt-decode';
import {
  getInvalidCredentialsErrors,
  getLoginErrors,
  isInvalidCredentialsMessage,
  normalizeEmail,
} from '@/features/auth/validation/authRules';
import { authFontAssets } from '@/features/auth/theme/authTypography';

const ROLE_ADMIN = 3;

const INPUT_STYLE = {
  borderWidth: 1.5,
  borderColor: 'rgba(255, 123, 63, 0.28)',
  backgroundColor: '#FFFFFF',
};

export default function AdminLoginScreen() {
  const router = useGuardedRouter();
  const { login } = useAuth();
  const [fontsLoaded] = useFonts(authFontAssets);

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [serverErrors, setServerErrors] = useState({});

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

  const onSubmit = async () => {
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setLoading(true);
    setFormError('');
    setServerErrors({});

    try {
      const result = await authApi.login({
        ...values,
        email: normalizeEmail(values.email),
      });
      const decoded = jwtDecode(result.token);
      if (decoded?.role !== ROLE_ADMIN) {
        setFormError('This account is not an admin user.');
        return;
      }
      await login(result.token, result.onboardingCompleted);
      router.replace('/(admin)/organizers');
    } catch (error) {
      const message = error.message || 'Login failed. Please try again.';
      if (isInvalidCredentialsMessage(message)) {
        const invalidErrors = getInvalidCredentialsErrors();
        setServerErrors({ email: invalidErrors.email, password: invalidErrors.password });
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF7B3F" />
      </View>
    );
  }

  return (
    <AuthFormScaffold
      title="Admin"
      accentWord="login"
      onClose={() => router.replace('/(auth)/welcome')}
    >
      <TextField
        label="Email"
        value={values.email}
        onChangeText={(value) => onChange('email', value)}
        onBlur={() => onBlur('email')}
        error={touched.email ? fieldErrors.email || serverErrors.email : serverErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        inputStyle={INPUT_STYLE}
      />

      <PasswordField
        label="Password"
        value={values.password}
        onChangeText={(value) => onChange('password', value)}
        onBlur={() => onBlur('password')}
        error={touched.password ? fieldErrors.password || serverErrors.password : serverErrors.password}
        inputStyle={INPUT_STYLE}
      />

      {formError ? <AuthFormMessage tone="error" message={formError} /> : null}

      <AuthSubmitButton label="Sign in" onPress={onSubmit} loading={loading} />

      <Pressable onPress={() => router.replace('/(auth)/welcome')} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '600' }}>Back to welcome</Text>
      </Pressable>
    </AuthFormScaffold>
  );
}
