import React from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import useSignupForm from '@/features/auth/hooks/useSignupForm';
import TextField from '@/features/auth/components/TextField';
import PasswordField from '@/features/auth/components/PasswordField';
import SocialButtons from '@/features/auth/components/SocialButtons';
import { COLORS } from '@/constants/loginSignin/authStyles';

export default function SignupForm() {
  const router = useRouter();
  const { values, touched, errors, loading, isValid, onChange, onBlur, onSubmit } =
    useSignupForm();

  return (
    <LinearGradient colors={[COLORS.bgGradStart, COLORS.bgGradEnd]} style={{ flex: 1 }}>
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
              Create Account
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
              Create an account so you can explore all the events and meetups.
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
            {errors.form ? (
              <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
                {errors.form}
              </Text>
            ) : null}

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
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '700',
                    fontSize: 17,
                  }}
                >
                  Sign Up
                </Text>
              )}
            </Pressable>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  textAlign: 'center',
                  color: COLORS.primary,
                  marginBottom: 10,
                }}
              >
                Or continue with
              </Text>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
