import React, { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import SignOutButton from '@/components/auth/SignOutButton';
import VerificationBadgeWhite from '@/assets/verification badge white mode.svg';
import {
  OrganizerAvatar,
  OrganizerInfoRow,
  StatTile,
  formatCount,
} from '@/components/organizer/OrganizerProfileChrome';
import OrganizerTabScaffold from '@/features/organizer/components/OrganizerTabScaffold';
import useOrganizerDashboardData from '@/features/organizer/hooks/useOrganizerDashboardData';
import { countUpcomingOrganizerEvents } from '@/features/organizer/utils/organizerEventUtils';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import { COLORS } from '@/theme/colors';
import { useThemeColors } from '@/theme';

function statusTheme(status) {
  if (status === 'approved') return { label: 'Verified', color: COLORS.success };
  if (status === 'rejected') return { label: 'Rejected', color: COLORS.danger };
  if (status === 'pending') return { label: 'Under review', color: COLORS.warning };
  return { label: 'Not verified', color: COLORS.textSecondary };
}

function MenuRow({ icon, label, value, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: pressed ? COLORS.panel : COLORS.card,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
      })}
    >
      <Feather name={icon} size={18} color={COLORS.textPrimary} />
      <Text style={{ marginLeft: 12, flex: 1, color: COLORS.textPrimary, fontWeight: '600', fontSize: 16 }}>
        {label}
      </Text>
      {value ? <Text style={{ color: COLORS.textSecondary, marginRight: 6 }}>{value}</Text> : null}
      <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

export default function OrganizerOrganizationScreen() {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { user, organizerStatus } = useAuth();
  const {
    events,
    profileDashboard,
    verificationStatus,
    organizationName,
    headerFullName,
    refreshing,
    onRefresh,
    refresh,
  } = useOrganizerDashboardData();

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => {});
    }, [refresh]),
  );

  const d = profileDashboard || {};
  const displayName = organizationName || d.organizationName || user?.fullName || d.fullName || 'Organizer';
  const email = user?.email || d.email || 'Email not set';
  const status = verificationStatus || organizerStatus || d.verificationStatus || 'unverified';
  const badge = statusTheme(status);
  const avatarUri = resolveApiAssetUrl(user?.profileImg || d.profileImg);
  const upcomingCount = useMemo(() => countUpcomingOrganizerEvents(events), [events]);

  const stats = useMemo(
    () => [
      { key: 'events', label: 'Events', value: formatCount(d.eventsCount), href: '/(organizer)/(tabs)/events' },
      { key: 'attendees', label: 'Attendees', value: formatCount(d.attendeesTotal), href: '/(organizer)/attendees' },
      { key: 'upcoming', label: 'Upcoming', value: formatCount(upcomingCount), href: '/(organizer)/(tabs)/events' },
    ],
    [d.eventsCount, d.attendeesTotal, upcomingCount],
  );

  const openEditProfile = () => router.push('/(organizer)/edit-profile');

  return (
    <OrganizerTabScaffold title="Profile" orgName={displayName} showFab={false}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 14, paddingBottom: 48 }}
      >
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={openEditProfile} style={{ position: 'relative' }}>
            <OrganizerAvatar uri={avatarUri} name={displayName} />
            <View
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            >
              <Feather name="edit-2" size={14} color="#FFFFFF" />
            </View>
          </Pressable>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.textPrimary }}>{displayName}</Text>
            {badge.label === 'Verified' ? <VerificationBadgeWhite width={16} height={16} style={{ marginLeft: 8 }} /> : null}
          </View>
          <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>{email}</Text>
          <Text style={{ marginTop: 8, color: badge.color, fontWeight: '700' }}>{badge.label}</Text>
          <Pressable
            onPress={openEditProfile}
            style={({ pressed }) => ({
              marginTop: 14,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: COLORS.primary,
              backgroundColor: pressed ? '#FFF7ED' : '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            })}
          >
            <Feather name="edit-3" size={16} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 14 }}>Edit profile</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          {stats.map((item) => (
            <Pressable key={item.key} onPress={() => router.push(item.href)} style={{ flex: 1 }}>
              <StatTile label={item.label} value={item.value} />
            </Pressable>
          ))}
        </View>

        <OrganizerInfoRow icon="globe" label="WEBSITE" value={d.website} />
        <OrganizerInfoRow icon="phone" label="PHONE" value={d.phone || user?.phoneNumber || user?.phone || ''} />

        <Text style={{ marginTop: 16, marginBottom: 8, color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
          QUICK LINKS
        </Text>
        <MenuRow icon="edit" label="Edit profile" onPress={openEditProfile} />
        <MenuRow icon="users" label="Attendees" onPress={() => router.push('/(organizer)/attendees')} />
        <MenuRow icon="bar-chart-2" label="Reports" onPress={() => router.push('/(organizer)/reports/overview')} />
        <MenuRow icon="settings" label="Settings" onPress={() => router.push('/(organizer)/settings')} />
        {user?.id ? (
          <MenuRow icon="eye" label="View public page" onPress={() => router.push(`/organizer/${user.id}`)} />
        ) : null}

        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <SignOutButton redirectTo="/(auth)/welcome" />
        </View>
      </ScrollView>
    </OrganizerTabScaffold>
  );
}
