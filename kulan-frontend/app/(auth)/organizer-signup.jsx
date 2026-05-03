import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/loginSignin/authStyles';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { isOrganizerSubmissionReadyForReview } from '@/utils/organizerVerification';
import BackToWelcomeRow from '@/features/auth/components/BackToWelcomeRow';

export default function OrganizerSignupScreen() {
  const router = useRouter();
  const { loginAsOrganizer } = useAuth();

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirm: '',
  });
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    location: false,
    password: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fieldErrors = useMemo(() => {
    const errors = {};
    if (!values.fullName.trim()) errors.fullName = 'Full name is required';
    if (!values.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = 'Invalid email format';
    if (!values.phone.trim()) errors.phone = 'Phone is required';
    if (!values.location.trim()) errors.location = 'Location is required';
    if (!values.password) errors.password = 'Password is required';
    else if (values.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!values.confirm) errors.confirm = 'Confirm password is required';
    else if (values.password !== values.confirm) errors.confirm = 'Passwords do not match';
    return errors;
  }, [values]);

  const isValid = Object.keys(fieldErrors).length === 0;

  const onChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onSubmit = async () => {
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      location: true,
      password: true,
      confirm: true,
    });
    if (!isValid) return;

    setLoading(true);
    setFormError('');

    try {
      await organizerApi.organizerRegister({
        full_name: values.fullName,
        email: values.email,
        phone: values.phone,
        location: values.location,
        password: values.password,
      });

      const result = await organizerApi.organizerLogin({
        email: values.email,
        password: values.password,
      });

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
      setFormError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cardBg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="always"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 40,
            paddingBottom: 120,
          }}
        >
          <View style={{ marginBottom: 25, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 28,
                color: COLORS.primary,
                fontWeight: '800',
                textAlign: 'center',
              }}
            >
              Organizer Sign Up
            </Text>
            <Text
              style={{
                marginTop: 6,
                color: COLORS.textLight,
                opacity: 0.9,
                fontSize: 15,
                textAlign: 'center',
                width: '90%',
              }}
            >
              Create your organizer account to manage events
            </Text>
          </View>

          <View
            style={{
              backgroundColor: COLORS.cardBg,
              borderRadius: 26,
              paddingHorizontal: 24,
              paddingVertical: 34,
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

            <TextField
              label="Full Name"
              value={values.fullName}
              onChangeText={(value) => onChange('fullName', value)}
              onBlur={() => onBlur('fullName')}
              error={touched.fullName ? fieldErrors.fullName : ''}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />

            <TextField
              label="Email"
              value={values.email}
              onChangeText={(value) => onChange('email', value)}
              onBlur={() => onBlur('email')}
              error={touched.email ? fieldErrors.email : ''}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextField
              label="Phone Number"
              value={values.phone}
              onChangeText={(value) => onChange('phone', value)}
              onBlur={() => onBlur('phone')}
              error={touched.phone ? fieldErrors.phone : ''}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <TextField
              label="Location"
              value={values.location}
              onChangeText={(value) => onChange('location', value)}
              onBlur={() => onBlur('location')}
              error={touched.location ? fieldErrors.location : ''}
              placeholder="City, Country"
            />

            <PasswordField
              label="Password"
              value={values.password}
              onChangeText={(value) => onChange('password', value)}
              onBlur={() => onBlur('password')}
              error={touched.password ? fieldErrors.password : ''}
              placeholder="Create password"
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
              error={touched.confirm ? fieldErrors.confirm : ''}
              placeholder="Confirm password"
              inputStyle={{
                borderWidth: 1,
                borderColor: COLORS.inputBorder,
                backgroundColor: COLORS.inputBg,
              }}
            />

            <Pressable
              onPress={onSubmit}
              disabled={!isValid || loading}
              style={{
                height: 50,
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 25,
                opacity: !isValid || loading ? 0.5 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 17 }}>
                  Sign Up as Organizer
                </Text>
              )}
            </Pressable>

            <Text
              style={{
                textAlign: 'center',
                color: COLORS.textDark,
                fontSize: 15,
                marginTop: 10,
              }}
            >
              Already have an account?{' '}
              <Text
                style={{ color: COLORS.primary, fontWeight: '700' }}
                onPress={() => router.push('/(auth)/organizer-login')}
              >
                Login
              </Text>
            </Text>

            <BackToWelcomeRow />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
