import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { COLORS } from '@/constants/loginSignin/authStyles';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { isOrganizerSubmissionReadyForReview } from '@/utils/organizerVerification';
import BackToWelcomeRow from '@/features/auth/components/BackToWelcomeRow';

export default function OrganizerLoginScreen() {
  const router = useRouter();
  const { loginAsOrganizer } = useAuth();

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fieldErrors = useMemo(() => {
    const errors = {};
    if (!values.email.trim()) errors.email = 'Email is required';
    if (!values.password) errors.password = 'Password is required';
    return errors;
  }, [values]);

  const isValid = !fieldErrors.email && !fieldErrors.password;

  const onChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onSubmit = async () => {
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setLoading(true);
    setFormError('');

    try {
      const result = await organizerApi.organizerLogin(values);
      await loginAsOrganizer(result.token, result.organizerStatus, result.rejectionReason);

      if (result.organizerStatus === 'approved') {
        router.replace('/(organizer)/dashboard');
      } else if (result.organizerStatus === 'rejected') {
        router.replace('/(organizer-status)/verification-failed');
      } else {
        const detail = await organizerApi.getOrganizerStatus();
        const ready = isOrganizerSubmissionReadyForReview(detail);
        router.replace(
          ready ? '/(organizer-status)/pending-verification' : '/(organizer-status)/resubmit-verification',
        );
      }
    } catch (error) {
      setFormError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cardBg }}>
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
              Organizer Login
            </Text>
            <Text
              style={{
                textAlign: 'center',
                marginTop: 6,
                color: COLORS.textLight,
                fontSize: 15,
              }}
            >
              Access your organizer dashboard
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
            {formError ? (
              <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
                {formError}
              </Text>
            ) : null}

            <View style={{ marginBottom: 18 }}>
              <TextField
                label="Email"
                placeholder="organizer@example.com"
                value={values.email}
                onChangeText={(value) => onChange('email', value)}
                onBlur={() => onBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                error={touched.email ? fieldErrors.email : ''}
                inputStyle={{
                  borderWidth: 1,
                  borderColor: COLORS.inputBorder,
                  backgroundColor: COLORS.inputBg,
                }}
              />
            </View>

            <View style={{ marginBottom: 22 }}>
              <PasswordField
                label="Password"
                placeholder="••••••••"
                value={values.password}
                onChangeText={(value) => onChange('password', value)}
                onBlur={() => onBlur('password')}
                error={touched.password ? fieldErrors.password : ''}
                inputStyle={{
                  borderWidth: 1,
                  borderColor: COLORS.inputBorder,
                  backgroundColor: COLORS.inputBg,
                }}
              />
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={!isValid || loading}
              style={{
                backgroundColor: COLORS.primary,
                height: 50,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: !isValid || loading ? 0.5 : 1,
              }}
            >
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '700' }}>
                {loading ? 'Signing in...' : 'Sign in as Organizer'}
              </Text>
            </Pressable>

            <Text
              style={{
                textAlign: 'center',
                marginTop: 24,
                color: COLORS.textDark,
                fontSize: 15,
              }}
            >
              Don't have an account?{' '}
              <Text
                style={{ color: COLORS.primary, fontWeight: '700' }}
                onPress={() => router.push('/(auth)/organizer-signup')}
              >
                Sign up
              </Text>
            </Text>

            <BackToWelcomeRow />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
