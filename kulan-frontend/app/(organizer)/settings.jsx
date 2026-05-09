import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import VerificationBadgeWhite from '@/assets/verification badge white mode.svg';
import { COLORS } from '@/theme/colors';
import { spacing } from '@/theme';

function SectionTitle({ children }) {
  return (
    <Text style={{ color: COLORS.textSecondary, fontSize: 12, letterSpacing: 1.2, fontWeight: '700', marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function MenuRow({ icon, label, value, onPress, danger = false, trailingSwitch, hitSlop = 8 }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => ({
        minHeight: 54,
        borderRadius: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: pressed ? COLORS.panel : COLORS.card,
      })}
    >
      <Feather name={icon} size={19} color={danger ? COLORS.danger : COLORS.textPrimary} />
      <Text style={{ marginLeft: 14, color: danger ? COLORS.danger : COLORS.textPrimary, fontSize: 17, fontWeight: '600', flex: 1 }}>
        {label}
      </Text>
      {trailingSwitch || null}
      {!trailingSwitch ? (
        <>
          {value ? <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginRight: 6 }}>{value}</Text> : null}
          <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
        </>
      ) : null}
    </Pressable>
  );
}

export default function OrganizerSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, organizerStatus } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);

  const profileName = useMemo(() => user?.fullName || user?.name || 'Organizer', [user?.fullName, user?.name]);
  const profileSubtitle = useMemo(() => user?.email || 'Account settings', [user?.email]);
  const isVerified = organizerStatus === 'approved';

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 24, fontWeight: '800' }}>
            Settings
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <View
          style={{
            borderRadius: 18,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 22,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: COLORS.panel,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="user" size={24} color={COLORS.primary} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 23, fontWeight: '700', flexShrink: 1 }}>
                {profileName}
              </Text>
              {isVerified ? <VerificationBadgeWhite width={16} height={16} style={{ marginLeft: 8 }} /> : null}
            </View>
            <Text numberOfLines={1} style={{ color: COLORS.textSecondary, marginTop: 2, fontSize: 15 }}>
              {profileSubtitle}
            </Text>
          </View>
        </View>

        <SectionTitle>ACCOUNT</SectionTitle>
        <MenuRow icon="user" label="Edit Profile" onPress={() => router.push('/(organizer)/edit-profile')} />
        <MenuRow icon="lock" label="Change Password" onPress={() => router.push('/(modal)/changePassword')} />

        <SectionTitle>NOTIFICATIONS</SectionTitle>
        <MenuRow
          icon="bell"
          label="Push Notifications"
          onPress={() => setPushEnabled((prev) => !prev)}
          trailingSwitch={
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primaryBorder }}
              thumbColor={pushEnabled ? COLORS.primary : COLORS.card}
            />
          }
        />
        <MenuRow icon="mail" label="Email Alerts" value="Coming soon" onPress={() => {}} />

        <SectionTitle>PREFERENCES</SectionTitle>
        <MenuRow icon="globe" label="Language" value="English (US)" onPress={() => {}} />
        <MenuRow icon="moon" label="Dark Mode" value="Coming soon" onPress={() => {}} />

        <SectionTitle>SUPPORT</SectionTitle>
        <MenuRow icon="help-circle" label="Help Center" onPress={() => {}} />
        <MenuRow icon="shield" label="Privacy Policy" onPress={() => {}} />
        <MenuRow icon="file-text" label="Terms of Service" onPress={() => {}} />

        <SectionTitle>DANGER ZONE</SectionTitle>
        <MenuRow icon="log-out" label="Sign Out" danger onPress={handleSignOut} />
      </ScrollView>
    </View>
  );
}
