import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';

import useLoginForm from '@/features/auth/hooks/useLoginForm';
import AuthDivider from '@/features/auth/components/AuthDivider';
import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import AuthFormScaffold from '@/features/auth/components/AuthFormScaffold';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import SocialButtons from '@/features/auth/components/SocialButtons';
import BackToWelcomeRow from '@/features/auth/components/BackToWelcomeRow';
import { COLORS } from '@/constants/loginSignin/authStyles';

export default function LoginForm() {
  const router = useRouter();
  const { values, touched, errors, loading, isValid, onChange, onBlur, onSubmit } =
    useLoginForm();

  return (
    <AuthFormScaffold title="Login here" subtitle="Welcome back - you've been missed!" compact>
      <AuthFormMessage message={errors.form} />

            <View style={{ marginBottom: 18 }}>
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
                helperText={!touched.email ? 'Use the email format name@example.com.' : ''}
                inputStyle={{
                  borderWidth: 1,
                  borderColor: COLORS.inputBorder,
                  backgroundColor: COLORS.inputBg,
                }}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <PasswordField
                label="Password"
                placeholder="••••••••"
                value={values.password}
                onChangeText={(value) => onChange('password', value)}
                onBlur={() => onBlur('password')}
                error={touched.password ? errors.password : ''}
                helperText={!touched.password ? 'Passwords are case-sensitive.' : ''}
                inputStyle={{
                  borderWidth: 1,
                  borderColor: COLORS.inputBorder,
                  backgroundColor: COLORS.inputBg,
                }}
              />
            </View>

            <Text
              style={{
                color: COLORS.primary,
                textAlign: 'right',
                marginBottom: 22,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              Forgot your password?
            </Text>

            <AuthSubmitButton
              onPress={onSubmit}
              disabled={!isValid || loading}
              loading={loading}
              label="Sign in"
              loadingLabel="Signing in..."
              style={{ marginBottom: 28 }}
            />

            <View style={{ marginBottom: 20 }}>
              <AuthDivider />
              <SocialButtons />
            </View>

            <Text
              style={{
                textAlign: 'center',
                marginTop: 24,
                color: COLORS.textDark,
                fontSize: 15,
              }}
            >
              Create new account?
              <Text
                style={{ color: COLORS.primary, fontWeight: '700' }}
                onPress={() => router.push('/(auth)/signup')}
              >
                {' '}Register
              </Text>
            </Text>

            <BackToWelcomeRow />
    </AuthFormScaffold>
  );
}
