import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';

import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { spacing, useThemeColors } from '@/theme';

type HomeHeaderProps = {
  displayName?: string;
  location?: string;
  isGuest?: boolean;
};

export function HomeHeader({ displayName, location, isGuest = false }: HomeHeaderProps) {
  const colors = useThemeColors();
  const router = useGuardedRouter();

  return (
    <View style={styles.root}>
      {isGuest ? (
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(auth)/welcome')}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Open login and signup"
        >
          <View style={styles.guestIconWrap}>
            <Ionicons name="person-outline" size={22} color={colors.primary} />
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
          <MemberInitialAvatar name={displayName || 'Member'} size={52} borderWidth={0} />
          <View style={styles.profileText}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color={colors.textSecondary} style={styles.locationIcon} />
              <Text
                style={[styles.location, { color: colors.textSecondary }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
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
  profileCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
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
  guestIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    alignItems: 'flex-start',
    marginTop: 2,
    gap: 4,
  },
  locationIcon: {
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
    flexShrink: 1,
  },
});
