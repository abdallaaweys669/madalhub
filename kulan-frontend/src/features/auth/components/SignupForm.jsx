import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';

import useSignupForm from '@/features/auth/hooks/useSignupForm';
import AuthDivider from '@/features/auth/components/AuthDivider';
import AuthFormMessage from '@/features/auth/components/AuthFormMessage';
import AuthFormScaffold from '@/features/auth/components/AuthFormScaffold';
import AuthSubmitButton from '@/features/auth/components/AuthSubmitButton';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import SocialButtons from '@/features/auth/components/SocialButtons';
import BackToWelcomeRow from '@/features/auth/components/BackToWelcomeRow';
import { COLORS } from '@/constants/loginSignin/authStyles';

export default function SignupForm() {
  const router = useRouter();
  const { values, touched, errors, loading, isValid, onChange, onBlur, onSubmit } =
    useSignupForm();

  return (
    <AuthFormScaffold
      title="Create Account"
      subtitle="Create an account so you can explore all the events and meetups."
    >
      <AuthFormMessage message={errors.form} />

            <TextField
              label="Full Name"
              value={values.fullName}
              onChangeText={(value) => onChange('fullName', value)}
              onBlur={() => onBlur('fullName')}
              error={touched.fullName ? errors.fullName : ''}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />

            <TextField
              label="Email"
              value={values.email}
              onChangeText={(value) => onChange('email', value)}
              onBlur={() => onBlur('email')}
              error={touched.email ? errors.email : ''}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              helperText={!touched.email ? 'Example: name@example.com.' : ''}
            />

            <TextField
              label="Phone Number"
              value={values.phone}
              onChangeText={(value) => onChange('phone', value)}
              onBlur={() => onBlur('phone')}
              error={touched.phone ? errors.phone : ''}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <PasswordField
              label="Password"
              value={values.password}
              onChangeText={(value) => onChange('password', value)}
              onBlur={() => onBlur('password')}
              error={touched.password ? errors.password : ''}
              placeholder="Create password"
              helperText={!touched.password ? 'Use at least 8 chars with upper, lower & a number.' : ''}
              inputStyle={{
                borderWidth: 1,
                borderColor: COLORS.inputBorder,
                backgroundColor: COLORS.inputBg,
              }}
            />

            <PasswordField
              label="Confirm Password"
              value={values.confirm}
              onChangeText={(value) => onChange('confirm', value)}
              onBlur={() => onBlur('confirm')}
              error={touched.confirm ? errors.confirm : ''}
              placeholder="Confirm password"
              inputStyle={{
                borderWidth: 1,
                borderColor: COLORS.inputBorder,
                backgroundColor: COLORS.inputBg,
              }}
            />

            <AuthSubmitButton
              onPress={onSubmit}
              disabled={!isValid || loading}
              loading={loading}
              label="Sign Up"
              style={{ marginBottom: 25 }}
            />

            <View style={{ marginBottom: 20 }}>
              <AuthDivider />
              <SocialButtons />
            </View>

            <Text
              style={{
                textAlign: 'center',
                color: COLORS.textDark,
                fontSize: 15,
                marginTop: 10,
              }}
            >
              Already have an account?
              <Text
                style={{ color: COLORS.primary, fontWeight: '700' }}
                onPress={() => router.push('/(auth)/login')}
              >
                {' '}Login
              </Text>
            </Text>

            <BackToWelcomeRow />
    </AuthFormScaffold>
  );
}
