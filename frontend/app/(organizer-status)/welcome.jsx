import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import useGuardedRouter from '@/hooks/useGuardedRouter';
import useAuth from '@/auth/useAuth';
import OrganizerSvg from '@/assets/organizer.svg';
import { COLORS } from '@/constants/loginSignin/authStyles';
import {
  authFontAssets,
  FONT_JAKARTA_BOLD,
  FONT_JAKARTA_REGULAR,
  FONT_PLAYFAIR_BOLD,
} from '@/features/auth/theme/authTypography';

const ORANGE = COLORS.primary;
const MADALHUB_LOGO = require('@/assets/madalhub_logo.png');

const BENEFITS = [
  {
    icon: 'shield-checkmark-outline',
    title: 'Build trust',
    description: 'More visibility and trust from members.',
  },
  {
    icon: 'time-outline',
    title: 'Super simple',
    description: 'Done in under a minute.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Safe & secure',
    description: 'Your info stays private and secure.',
  },
];

export default function OrganizerWelcomeScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { logout } = useAuth();
  const [fontsLoaded] = useFonts(authFontAssets);

  const compact = height < 720;
  const heroHeight = compact ? 178 : 215;

  if (!fontsLoaded) {
    return (
      <View style={[styles.screen, styles.loading]}>
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.body}>
        <View style={styles.brandRow}>
          <Image source={MADALHUB_LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandTitle}>
            Madal<Text style={styles.brandAccent}>Hub</Text>
          </Text>
        </View>

        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <OrganizerSvg width="100%" height={heroHeight} />
        </View>

        <View style={styles.titleBlock}>
          <Text
            style={[styles.titleLine, compact && styles.titleLineCompact]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            Welcome to
          </Text>
          <Text
            style={[styles.titleLine, compact && styles.titleLineCompact]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            MadalHub <Text style={styles.titleAccent}>Organizer</Text>
          </Text>
        </View>

        <View style={[styles.benefitsSection, compact && styles.benefitsSectionCompact]}>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
            To publish and manage events, we need to verify your organizer profile.
          </Text>

          <View style={[styles.benefits, compact && styles.benefitsCompact]}>
          {BENEFITS.map((item) => (
            <View key={item.title} style={styles.benefitRow}>
              <View style={[styles.benefitIconWrap, compact && styles.benefitIconWrapCompact]}>
                <Ionicons name={item.icon} size={compact ? 24 : 26} color={ORANGE} />
              </View>
              <View style={[styles.benefitCopy, compact && styles.benefitCopyCompact]}>
                <Text style={[styles.benefitTitle, compact && styles.benefitTitleCompact]}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.benefitDesc, compact && styles.benefitDescCompact]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={styles.ctaBtn}
          onPress={() => router.replace('/(organizer-status)/verify')}
          accessibilityRole="button"
        >
          <Text style={styles.ctaLabel}>Start Verification</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.logoutRow} onPress={logout} accessibilityRole="button">
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  logo: {
    width: 36,
    height: 36,
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: FONT_JAKARTA_BOLD,
    color: '#111827',
    letterSpacing: 0.2,
  },
  brandAccent: {
    color: ORANGE,
  },
  heroWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  titleLine: {
    fontSize: 34,
    fontFamily: FONT_PLAYFAIR_BOLD,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.4,
    width: '100%',
  },
  titleLineCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleAccent: {
    color: ORANGE,
  },
  benefitsSection: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 4,
  },
  benefitsSectionCompact: {
    paddingTop: 0,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONT_JAKARTA_REGULAR,
    color: '#6B7280',
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 14,
    paddingRight: 8,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  benefits: {
    gap: 16,
  },
  benefitsCompact: {
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFF7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIconWrapCompact: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  benefitCopy: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  benefitCopyCompact: {
    minHeight: 48,
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: FONT_JAKARTA_BOLD,
    color: '#111827',
    marginBottom: 2,
    lineHeight: 20,
  },
  benefitTitleCompact: {
    fontSize: 15,
    lineHeight: 19,
  },
  benefitDesc: {
    fontSize: 13,
    fontFamily: FONT_JAKARTA_REGULAR,
    color: '#6B7280',
    lineHeight: 18,
  },
  benefitDescCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  ctaBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaLabel: {
    fontSize: 16,
    fontFamily: FONT_JAKARTA_BOLD,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  logoutRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
});
