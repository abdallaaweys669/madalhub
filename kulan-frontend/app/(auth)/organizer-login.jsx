import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
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

export default function OrganizerLoginScreen() {
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

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
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

            <View style={{ marginTop: 18, marginBottom: 8 }}>
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
                    if (!googleConfigured) return setFormError('Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (or web client id) in frontend .env first.');
                    if (!googleRequest) return setFormError('Google auth is still initializing.');
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
                    if (!facebookConfigured) return setFormError('Set EXPO_PUBLIC_FACEBOOK_APP_ID in frontend .env first.');
                    if (!facebookRequest) return setFormError('Facebook auth is still initializing.');
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
