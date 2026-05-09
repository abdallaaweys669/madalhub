import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import VerificationBadgeWhite from '@/assets/verification badge white mode.svg';
import { useThemeColors, spacing } from '@/theme';
import { COLORS } from '@/theme/colors';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

function initialsFromName(name) {
  if (!name || typeof name !== 'string') return 'OR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatCount(value) {
  const num = Number(value || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

function formatRating(value) {
  if (value == null || Number.isNaN(Number(value))) return '0';
  return Number(value).toFixed(1);
}

function statusTheme(status) {
  if (status === 'approved') return { label: 'Verified', icon: 'check-circle', color: COLORS.success };
  if (status === 'rejected') return { label: 'Rejected', icon: 'alert-circle', color: COLORS.danger };
  return { label: 'Pending', icon: 'clock', color: COLORS.warning };
}

function Avatar({ uri, name }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          borderWidth: 2,
          borderColor: COLORS.card,
          backgroundColor: COLORS.card,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 2,
        borderColor: COLORS.card,
        backgroundColor: COLORS.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text allowFontScaling={false} style={{ color: COLORS.primary, fontSize: 30, fontWeight: '800' }}>
        {initialsFromName(name)}
      </Text>
    </View>
  );
}

function StatTile({ label, value }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
      <Text allowFontScaling={false} style={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: '800' }}>
        {value}
      </Text>
      <Text allowFontScaling={false} style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: COLORS.panel,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Feather name={icon} size={16} color={COLORS.textPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.9 }}>
          {label}
        </Text>
        <Text allowFontScaling={false} style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
          {value || 'Not set'}
        </Text>
      </View>
    </View>
  );
}

export default function OrganizerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user, organizerStatus, logout } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    const payload = await organizerApi.getProfileDashboard();
    setDashboard(payload);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (mounted) setLoading(true);
        await fetchDashboard();
      } catch (error) {
        console.error('Failed to fetch profile dashboard:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [fetchDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDashboard();
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboard]);

  const d = dashboard || {};
  const stats = useMemo(
    () => [
      { key: 'events', label: 'Events', value: formatCount(d.eventsCount) },
      { key: 'followers', label: 'Followers', value: formatCount(d.followersCount) },
      { key: 'rating', label: 'Rating', value: formatRating(d.ratingAverage) },
    ],
    [d.eventsCount, d.followersCount, d.ratingAverage],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundMuted, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const displayName = d.organizationName || user?.fullName || d.fullName || 'Organizer';
  const email = user?.email || d.email || 'Email not set';
  const badge = statusTheme(organizerStatus || d.verificationStatus);
  const avatarUri = resolveApiAssetUrl(user?.profileImg || d.profileImg);
  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundMuted }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{
          paddingTop: insets.top + 6,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text
            allowFontScaling={false}
            style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 24, fontWeight: '800' }}
          >
            Profile
          </Text>
          <Pressable
            onPress={() => router.push('/(organizer)/settings')}
            hitSlop={12}
            style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.7 : 1 })}
          >
            <Feather name="settings" size={22} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <View style={{ position: 'relative' }}>
            <Avatar uri={avatarUri} name={displayName} />
            <Pressable
              onPress={() => router.push('/(organizer)/edit-profile')}
              hitSlop={10}
              style={({ pressed }) => ({
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 30,
                height: 30,
                borderRadius: 15,
                borderWidth: 2,
                borderColor: COLORS.card,
                backgroundColor: '#0B1535',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Feather name="edit-2" size={13} color={COLORS.card} />
            </Pressable>
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' }}>
              {displayName}
            </Text>
            {badge.label === 'Verified' ? <VerificationBadgeWhite width={16} height={16} style={{ marginLeft: 8 }} /> : null}
          </View>
          <Text allowFontScaling={false} style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4 }}>
            {email}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginTop: 18,
            marginBottom: 16,
            backgroundColor: 'transparent',
          }}
        >
          {stats.map((item) => (
            <View key={item.key} style={{ flex: 1 }}>
              <StatTile label={item.label} value={item.value} />
            </View>
          ))}
        </View>

        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Feather name="info" size={17} color={COLORS.textPrimary} />
            <Text allowFontScaling={false} style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginLeft: 8 }}>
              About {displayName}
            </Text>
          </View>
          <Text allowFontScaling={false} style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 }}>
            {d.organizationDescription || 'Tell members about your organization to build trust and attract attendees.'}
          </Text>

          <View style={{ height: 1, backgroundColor: COLORS.border, marginTop: 12, marginBottom: 2 }} />

          <InfoRow icon="map-pin" label="LOCATION" value={user?.location || d.location} />
          <InfoRow icon="globe" label="WEBSITE" value={d.website} />
          <InfoRow icon="mail" label="EMAIL" value={email} />
          <InfoRow icon="phone" label="PHONE" value={d.phone || user?.phoneNumber || user?.phone || ''} />
        </View>

        <View style={{ marginTop: 8 }}>
          <Text
            allowFontScaling={false}
            style={{ color: COLORS.danger, fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: 8 }}
          >
            DANGER ZONE
          </Text>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              minHeight: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#FECACA',
              backgroundColor: pressed ? '#FEF2F2' : '#FFF5F5',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
            })}
          >
            <Feather name="log-out" size={18} color={COLORS.danger} />
            <Text allowFontScaling={false} style={{ marginLeft: 12, color: COLORS.danger, fontSize: 16, fontWeight: '700' }}>
              Sign Out
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}
