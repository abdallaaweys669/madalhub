import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';

import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import {
  authFontAssets,
  FONT_JAKARTA_BOLD,
  FONT_JAKARTA_REGULAR,
  FONT_PLAYFAIR_BOLD,
} from '@/features/auth/theme/authTypography';
import { spacing, useThemeColors } from '@/theme';

type HomeHeaderProps = {
  displayName?: string;
  isGuest?: boolean;
};

function getDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning,';
  if (hour < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

function GuestWelcomeCard() {
  const colors = useThemeColors();
  const router = useGuardedRouter();
  const [fontsLoaded] = useFonts(authFontAssets);
  const titleFont = fontsLoaded ? { fontFamily: FONT_JAKARTA_BOLD } : null;
  const bodyFont = fontsLoaded ? { fontFamily: FONT_JAKARTA_REGULAR } : null;

  return (
    <TouchableOpacity
      style={styles.guestWelcomeOuter}
      onPress={() => router.push('/(auth)/welcome')}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel="Log in or sign up"
    >
      <LinearGradient
        colors={['#FFF8F5', '#FFEFE5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.guestWelcomeCard, { borderColor: '#FFB899' }]}
      >
        <View style={[styles.guestWelcomeIconWrap, { backgroundColor: colors.card }]}>
          <Ionicons name="person-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.guestWelcomeCopy}>
          <Text style={[styles.guestWelcomeTitle, titleFont, { color: colors.text }]} numberOfLines={1}>
            Continue with your account
          </Text>
          <Text style={[styles.guestWelcomeSubtitle, bodyFont, { color: colors.textSecondary }]} numberOfLines={2}>
            Log in or sign up to save events and get personalized picks.
          </Text>
        </View>
        <View style={[styles.guestWelcomeArrow, { backgroundColor: colors.card }]}>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function HomeHeader({ displayName, isGuest = false }: HomeHeaderProps) {
  const colors = useThemeColors();
  const router = useGuardedRouter();
  const [fontsLoaded] = useFonts(authFontAssets);

  if (isGuest) {
    return <GuestWelcomeCard />;
  }

  const firstName = (displayName || 'there').trim().split(/\s+/)[0] || 'there';
  const greeting = getDayGreeting();
  const greetingFont = fontsLoaded ? { fontFamily: FONT_JAKARTA_REGULAR } : null;
  const nameFont = fontsLoaded ? { fontFamily: FONT_PLAYFAIR_BOLD } : null;

  return (
    <View style={[styles.root, { borderBottomColor: colors.border }]}>
      <View style={styles.textWrap}>
        <Text style={[styles.greetingTime, greetingFont, { color: colors.textSecondary }]}>{greeting}</Text>
        <Text style={[styles.nameHighlight, nameFont, { color: colors.primary }]}>{firstName}</Text>
      </View>

      <TouchableOpacity
        style={[styles.actionPill, { backgroundColor: colors.backgroundMuted }]}
        onPress={() => router.push('/profile')}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
      >
        <MemberInitialAvatar name={displayName || 'Member'} size={34} borderWidth={0} />
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  guestWelcomeOuter: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  guestWelcomeCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  guestWelcomeIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestWelcomeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  guestWelcomeTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  guestWelcomeSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  guestWelcomeArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  greetingTime: {
    fontSize: 15,
    lineHeight: 21,
  },
  nameHighlight: {
    marginTop: 2,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0.1,
  },
  actionPill: {
    minHeight: 42,
    borderRadius: 999,
    paddingLeft: 5,
    paddingRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
});
