import React from 'react';
import { Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import styles, { COLORS } from '@/constants/loginSignin/authStyles';

// Import SVG as component
import Welcome3 from '@/assets/welcome3.svg';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[COLORS.bgGradStart, COLORS.bgGradEnd]}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}
    >
      {/* SVG Illustration */}
      <Welcome3 width={260} height={260} style={{ marginBottom: 10 }} />

      <Text style={{ fontSize: 32, color: '#FF7B3F', fontWeight: '800', textAlign: 'center' }}>
        Welcome to Kulan
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: COLORS.textLight,
          opacity: 0.9,
          textAlign: 'center',
          marginTop: 6,
          marginBottom: 40,
        }}
      >
        Discover events, meetups, and people near you
      </Text>

      <Pressable
        onPress={() => router.push('/(auth)/login')}
        style={{
          backgroundColor: COLORS.primary,
          width: '100%',
          height: 50,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '700', fontSize: 17 }}>Login</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(auth)/signup')}
        style={{
          width: '100%',
          height: 50,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'white',
        }}
      >
        <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 17 }}>Sign Up</Text>
      </Pressable>
    </LinearGradient>
  );
}