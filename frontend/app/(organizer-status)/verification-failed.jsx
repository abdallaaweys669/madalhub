import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import { COLORS } from '@/constants/loginSignin/authStyles';

export default function VerificationFailedScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const handleResubmit = () => {
    router.push('/(organizer-status)/resubmit-verification');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <LinearGradient colors={[COLORS.bgGradStart, COLORS.bgGradEnd]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <Feather name="x-circle" size={40} color={COLORS.danger} />
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.danger, textAlign: 'center', letterSpacing: -0.5 }}>
            Verification failed
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.textLight,
              textAlign: 'center',
              marginTop: 10,
              lineHeight: 22,
              paddingHorizontal: 8,
            }}
          >
            We couldn’t approve your organizer verification this time. You can resubmit your details and documents whenever you’re ready.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 18,
            padding: 18,
            marginBottom: 22,
            borderWidth: 1,
            borderColor: 'rgba(15,23,42,0.06)',
            shadowColor: '#0F172A',
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 }}>
            What to do next
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textLight, lineHeight: 21 }}>
            Submit a full resubmission with clear documents and accurate organization information.
          </Text>
        </View>

        <Pressable
          onPress={handleResubmit}
          style={({ pressed }) => ({
            backgroundColor: COLORS.primary,
            borderRadius: 14,
            height: 52,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
            Resubmit verification
          </Text>
        </Pressable>

        <Pressable onPress={handleLogout} style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: COLORS.textLight, fontSize: 15, fontWeight: '600' }}>
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}
