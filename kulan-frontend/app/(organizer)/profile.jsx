import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { useThemeColors, spacing } from '@/theme';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

function initialsFromName(name) {
  if (!name || typeof name !== 'string') return 'O';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function statusTheme(status) {
  if (status === 'approved') return { bg: '#ECFDF5', fg: '#15803D', label: 'Verified' };
  if (status === 'rejected') return { bg: '#FEF2F2', fg: '#DC2626', label: 'Rejected' };
  return { bg: '#FFFBEB', fg: '#D97706', label: 'Pending' };
}

export default function OrganizerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user, logout, organizerStatus } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await organizerApi.getOrganizerStatus();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundMuted, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const avatarUri = resolveApiAssetUrl(user?.profileImg || user?.avatarUrl);
  const badge = statusTheme(organizerStatus);
  const cardRadius = 20;

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundMuted }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.xl + 8,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginLeft: -4 }} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <View
            style={{
              shadowColor: colors.text,
              shadowOpacity: 0.1,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 5,
              marginBottom: 16,
            }}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 34,
                  backgroundColor: colors.border,
                  borderWidth: 3,
                  borderColor: colors.card,
                }}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, '#FF9B5C']}
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 34,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: colors.card,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 34 }}>{initialsFromName(user?.fullName)}</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 }}>
            {user?.fullName || 'Organizer'}
          </Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 6 }}>{user?.email}</Text>
          <View style={{ marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: badge.bg }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: badge.fg, letterSpacing: 0.3 }}>{badge.label}</Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: colors.textSecondary,
            marginBottom: 10,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Organization
        </Text>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: cardRadius,
            padding: 4,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {[
            { icon: 'briefcase', label: 'Name', value: status?.organizationName || 'Not set' },
            { icon: 'mail', label: 'Contact email', value: user?.email },
            { icon: 'map-pin', label: 'Location', value: user?.location || 'Not set' },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: colors.primarySoft,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
              >
                <Feather name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>{item.label}</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 }} numberOfLines={3}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {status?.organizationDescription ? (
          <>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                marginBottom: 10,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              About
            </Text>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: cardRadius,
                padding: 18,
                marginBottom: 22,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>{status.organizationDescription}</Text>
            </View>
          </>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: colors.backgroundMuted,
            borderRadius: 16,
            padding: 16,
            marginBottom: 22,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Feather name="info" size={20} color={colors.textSecondary} style={{ marginRight: 12, marginTop: 2 }} />
          <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary }}>
            Your profile photo comes from your account. Update it in member settings when that option is available, or it
            will show initials here.
          </Text>
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            borderRadius: cardRadius,
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#FECACA',
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Feather name="log-out" size={20} color={COLORS.danger} style={{ marginRight: 10 }} />
          <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 16 }}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
