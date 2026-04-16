import React from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import useLoginForm from '@/features/auth/hooks/useLoginForm';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import SocialButtons from '@/features/auth/components/SocialButtons';
import { COLORS } from '@/constants/loginSignin/authStyles';

export default function LoginForm() {
  const router = useRouter();
  const { values, touched, errors, loading, isValid, onChange, onBlur, onSubmit } =
    useLoginForm();

  return (
    <LinearGradient colors={[COLORS.bgGradStart, COLORS.bgGradEnd]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 20, marginBottom: 25, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: COLORS.primary,
                textAlign: 'center',
              }}
            >
              Login here
            </Text>

            <Text
              style={{
                textAlign: 'center',
                marginTop: 6,
                color: COLORS.textLight,
                fontSize: 15,
              }}
            >
              Welcome back — you've been missed!
            </Text>
          </View>

          <View
            style={{
              backgroundColor: COLORS.cardBg,
              borderRadius: 26,
              paddingVertical: 35,
              paddingHorizontal: 24,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {errors.form ? (
              <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
                {errors.form}
              </Text>
            ) : null}

            <View style={{ marginBottom: 18 }}>
              <TextField
                label="Email"
                placeholder="example@gmail.com"
                value={values.email}
                onChangeText={(value) => onChange('email', value)}
                onBlur={() => onBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                error={touched.email ? errors.email : ''}
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

            <Pressable
              onPress={onSubmit}
              disabled={!isValid || loading}
              style={{
                backgroundColor: COLORS.primary,
                height: 50,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 28,
                opacity: !isValid || loading ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontSize: 17,
                  fontWeight: '700',
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Text>
            </Pressable>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: COLORS.primary, marginBottom: 10 }}>
                Or continue with
              </Text>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
