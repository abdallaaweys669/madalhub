import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { COLORS } from '@/constants/loginSignin/authStyles';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { isOrganizerSubmissionReadyForReview } from '@/utils/organizerVerification';
import BackToWelcomeRow from '@/features/auth/components/BackToWelcomeRow';

WebBrowser.maybeCompleteAuthSession();

export default function OrganizerSignupScreen() {
  const router = useRouter();
  const { loginAsOrganizer } = useAuth();
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleWebClientId || 'missing-google-client-id';
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleWebClientId || 'missing-google-client-id';
  const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';
  const googleConfigured =
    Boolean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) ||
    Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  const facebookConfigured = Boolean(facebookAppId);

  const [values, setValues] = useState({
    organizationName: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [touched, setTouched] = useState({
    organizationName: false,
    email: false,
    password: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [formError, setFormError] = useState('');
  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    webClientId: googleWebClientId || googleAndroidClientId,
    androidClientId: googleAndroidClientId,
    iosClientId: googleIosClientId,
  });
  const [facebookRequest, facebookResponse, promptFacebook] = Facebook.useAuthRequest({
    clientId: facebookAppId || 'missing-facebook-app-id',
  });

  const fieldErrors = useMemo(() => {
    const errors = {};
    if (!values.organizationName.trim()) errors.organizationName = 'Organization name is required';
    if (!values.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = 'Invalid email format';
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
      organizationName: true,
      email: true,
      password: true,
      confirm: true,
    });
    if (!isValid) return;

    setLoading(true);
    setFormError('');

    try {
      await organizerApi.organizerRegister({
        full_name: values.organizationName,
        email: values.email,
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

  const routeOrganizerAfterLogin = async (result) => {
    await loginAsOrganizer(result.token, result.organizerStatus, result.rejectionReason);
    if (result.organizerStatus === 'approved') {
      router.replace('/(organizer)/dashboard');
      return;
    }
    if (result.organizerStatus === 'rejected') {
      router.replace('/(organizer-status)/verification-failed');
      return;
    }
    const detail = await organizerApi.getOrganizerStatus();
    const ready = isOrganizerSubmissionReadyForReview(detail);
    router.replace(
      ready ? '/(organizer-status)/pending-verification' : '/(organizer-status)/resubmit-verification',
    );
  };

  React.useEffect(() => {
    const run = async () => {
      if (googleResponse?.type !== 'success') return;
      try {
        setFormError('');
        setSocialLoading('google');
        const auth = googleResponse.authentication || {};
        const result = await organizerApi.organizerSocialLogin({
          provider: 'google',
          idToken: auth.idToken,
          accessToken: auth.accessToken,
          email: values.email,
          fullName: values.organizationName,
        });
        await routeOrganizerAfterLogin(result);
      } catch (error) {
        setFormError(error?.message || 'Google sign-in failed');
      } finally {
        setSocialLoading('');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  React.useEffect(() => {
    const run = async () => {
      if (facebookResponse?.type !== 'success') return;
      try {
        setFormError('');
        setSocialLoading('facebook');
        const auth = facebookResponse.authentication || {};
        const result = await organizerApi.organizerSocialLogin({
          provider: 'facebook',
          accessToken: auth.accessToken,
          email: values.email,
          fullName: values.organizationName,
        });
        await routeOrganizerAfterLogin(result);
      } catch (error) {
        setFormError(error?.message || 'Facebook login failed');
      } finally {
        setSocialLoading('');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facebookResponse]);

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
              label="Organization Name"
              value={values.organizationName}
              onChangeText={(value) => onChange('organizationName', value)}
              onBlur={() => onBlur('organizationName')}
              error={touched.organizationName ? fieldErrors.organizationName : ''}
              placeholder="Enter organization name"
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

            <View style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                <Text style={{ marginHorizontal: 12, color: COLORS.textLight, fontSize: 13, fontWeight: '600' }}>
                  or continue with
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => {
                    if (!googleConfigured) {
                      return Alert.alert('Google', 'Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (or web client id) in frontend .env first.');
                    }
                    if (!googleRequest) return Alert.alert('Google', 'Google auth is still initializing.');
                    promptGoogle();
                  }}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: 12,
                    borderWidth: 1.2,
                    borderColor: '#E5E7EB',
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  {socialLoading === 'google' ? <ActivityIndicator size="small" color="#EA4335" /> : <Ionicons name="logo-google" size={18} color="#EA4335" />}
                  <Text style={{ color: '#111827', fontWeight: '700' }}>Google</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!facebookConfigured) {
                      return Alert.alert('Facebook', 'Set EXPO_PUBLIC_FACEBOOK_APP_ID in frontend .env first.');
                    }
                    if (!facebookRequest) return Alert.alert('Facebook', 'Facebook auth is still initializing.');
                    promptFacebook();
                  }}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: 12,
                    borderWidth: 1.2,
                    borderColor: '#E5E7EB',
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  {socialLoading === 'facebook' ? <ActivityIndicator size="small" color="#1877F2" /> : <Ionicons name="logo-facebook" size={18} color="#1877F2" />}
                  <Text style={{ color: '#111827', fontWeight: '700' }}>Facebook</Text>
                </Pressable>
              </View>
            </View>

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
