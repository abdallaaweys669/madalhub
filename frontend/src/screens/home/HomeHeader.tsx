import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useAuth from '@/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';

import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import {
  authFontAssets,
  FONT_JAKARTA_BOLD,
  FONT_JAKARTA_REGULAR,
} from '@/features/auth/theme/authTypography';
import { spacing, useThemeColors } from '@/theme';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

type HomeHeaderProps = {
  displayName?: string;
  isGuest?: boolean;
};

function getDayGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function formatHomeHeaderName(raw: string): string {
  const name = raw.trim() || 'Member';
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return parts[0];
  }

  if (name.length > 20) {
    return `${name.slice(0, 18).trim()}…`;
  }

  return name;
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
  const { user } = useAuth();
  const [fontsLoaded] = useFonts(authFontAssets);

  const avatarUrl = useMemo(() => {
    const raw = user?.profileImg || user?.avatarUrl || null;
    return resolveApiAssetUrl(raw);
  }, [user?.profileImg, user?.avatarUrl]);

  if (isGuest) {
    return <GuestWelcomeCard />;
  }

  const fullName = (displayName || 'Member').trim() || 'Member';
  const headerName = formatHomeHeaderName(fullName);
  const greeting = getDayGreeting();
  const greetingFont = fontsLoaded ? { fontFamily: FONT_JAKARTA_REGULAR } : null;
  const nameFont = fontsLoaded ? { fontFamily: FONT_JAKARTA_BOLD } : null;

  return (
    <View style={styles.root}>
      <TouchableOpacity
        style={styles.profileTap}
        onPress={() => router.push('/profile')}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <MemberInitialAvatar name={fullName} size={48} borderWidth={0} />
        )}

        <View style={styles.textWrap}>
          <Text style={[styles.greetingTime, greetingFont, { color: colors.textSecondary }]}>
            {greeting}
          </Text>
          <Text
            style={[styles.displayName, nameFont, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            accessibilityLabel={fullName}
          >
            {headerName}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.notificationBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/(tabs)/notifications')}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Open notifications"
      >
        <Ionicons name="notifications-outline" size={22} color={colors.text} />
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
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  profileTap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  greetingTime: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
  },
  displayName: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});
