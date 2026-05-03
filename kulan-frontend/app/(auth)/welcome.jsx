import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { COLORS } from '@/constants/loginSignin/authStyles';
import useAuth from '@/auth/useAuth';
import { getMemberTabsReturnHref } from '@/navigation/memberTabsReturn';
import { getOrganizerEntryHref } from '@/navigation/organizerGate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Welcome3 from '@/assets/welcome3.svg';

const SIGNATURE = 'DancingScript_600SemiBold';
const SIGNATURE_ACCENT = 'DancingScript_700Bold';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isOrganizer, organizerStatus } = useAuth();
  const [fontsLoaded] = useFonts({
    DancingScript_600SemiBold: require('../../assets/fonts/DancingScript_600SemiBold.ttf'),
    DancingScript_700Bold: require('../../assets/fonts/DancingScript_700Bold.ttf'),
  });

  const handleCancel = () => {
    if (isLoggedIn && isOrganizer) {
      router.replace(getOrganizerEntryHref(organizerStatus));
      return;
    }
    router.replace(getMemberTabsReturnHref());
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cardBg }}>
      <View
        style={{
          position: 'absolute',
          top: insets.top + 8,
          right: 20,
          zIndex: 5,
        }}
      >
        <Pressable onPress={handleCancel} hitSlop={10}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#8B8E9C' }}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 28,
        }}
      >
        <Welcome3 width={260} height={260} style={{ marginBottom: 10, alignSelf: 'center' }} />

        <Text style={{ fontSize: 32, color: COLORS.primary, fontWeight: '800', textAlign: 'center' }}>
          Welcome to Kulan
        </Text>

        <View
          style={{
            marginTop: 14,
            marginBottom: 40,
            paddingHorizontal: 16,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: fontsLoaded ? SIGNATURE : undefined,
              fontSize: 25,
              lineHeight: 36,
              textAlign: 'center',
              color: COLORS.textDark,
              letterSpacing: 0.25,
              maxWidth: 340,
            }}
          >
            Join events or create your own
            <Text
              style={{
                fontFamily: fontsLoaded ? SIGNATURE_ACCENT : undefined,
                color: COLORS.primary,
              }}
            >
              {' — all in one place.'}
            </Text>
          </Text>
        </View>

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
            borderColor: COLORS.primary,
            marginBottom: 28,
          }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 17 }}>Sign Up</Text>
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          <Text
            style={{
              marginHorizontal: 14,
              fontSize: 12,
              fontWeight: '700',
              color: COLORS.textLight,
              letterSpacing: 1.2,
            }}
          >
            OR
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
        </View>

        <View
          style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 16,
            padding: 18,
            width: '100%',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
          }}
        >
          <View style={{ flexDirection: 'row', marginBottom: 18 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: '#FFF7ED',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="megaphone-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.textDark }}>
                Organize events
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textLight, marginTop: 4, lineHeight: 20 }}>
                Create and manage your own events
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/organizer-login')}
            style={{
              backgroundColor: COLORS.cardBg,
              width: '100%',
              height: 50,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: COLORS.primary,
            }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 16 }}>Login as Organizer</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
