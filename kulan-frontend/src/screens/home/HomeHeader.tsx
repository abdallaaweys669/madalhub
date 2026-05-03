import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import KulanLogo from '@/assets/kulan_logo.svg';
import { spacing, useThemeColors } from '@/theme';

/** Logo scales for prominent branding (~46px tall, contained aspect). */
const LOGO_HEIGHT = 46;
const LOGO_WIDTH = Math.round((670 / 210) * LOGO_HEIGHT);

type HomeHeaderProps = {
  displayName?: string;
  location?: string;
  avatarUri?: string;
  isGuest?: boolean;
};

export function HomeHeader({ displayName, location, avatarUri, isGuest = false }: HomeHeaderProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const showPhoto = Boolean(avatarUri?.trim());

  return (
    <View style={styles.root}>
      <View style={styles.logoWrap}>
        <KulanLogo
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          accessibilityLabel="Kulan"
          preserveAspectRatio="xMidYMid meet"
        />
      </View>

      {isGuest ? (
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(auth)/welcome')}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Open login and signup"
        >
          <View style={styles.guestIconWrap}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.profileText}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              Continue with your account
            </Text>
            <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
              Login or sign up to access saved and going events
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/profile')}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          {showPhoto ? (
            <Image source={{ uri: avatarUri as string }} style={styles.avatar} />
          ) : (
            <View
              style={[styles.avatar, styles.avatarPlaceholder]}
              accessibilityRole="image"
              accessibilityLabel="Default profile photo"
            >
              <Ionicons name="person" size={26} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
                {location}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 0,
  },
  logoWrap: {
    alignSelf: 'center',
    marginTop: 16,
    height: LOGO_HEIGHT,
    justifyContent: 'center',
  },
  profileCard: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9CA3AF',
  },
  guestIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 140, 66, 0.12)',
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  location: {
    fontSize: 13,
    flexShrink: 1,
  },
});
