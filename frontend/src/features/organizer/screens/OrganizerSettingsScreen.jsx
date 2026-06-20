import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import useGuardedRouter from '@/hooks/useGuardedRouter';
import OrganizerStackHeader from '@/features/organizer/components/OrganizerStackHeader';
import { COLORS } from '@/theme/colors';

function SettingsRow({ icon, label, onPress, subtitle, disabled = false }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        borderRadius: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: pressed && !disabled ? COLORS.panel : COLORS.card,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <Feather name={icon} size={18} color={COLORS.textPrimary} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: COLORS.textPrimary, fontWeight: '600', fontSize: 16 }}>{label}</Text>
        {subtitle ? (
          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      {!disabled ? <Feather name="chevron-right" size={18} color={COLORS.textMuted} /> : null}
    </Pressable>
  );
}

export default function OrganizerSettingsScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <OrganizerStackHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
          ACCOUNT
        </Text>
        <SettingsRow
          icon="edit-2"
          label="Edit organization profile"
          onPress={() => router.push('/(organizer)/edit-profile')}
        />
        <SettingsRow
          icon="lock"
          label="Change password"
          onPress={() => router.push('/(modal)/changePassword')}
        />
        <SettingsRow
          icon="bell"
          label="Notification preferences"
          subtitle="Coming soon"
          disabled
        />

        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 1,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          SUPPORT & LEGAL
        </Text>
        <SettingsRow icon="help-circle" label="Help center" onPress={() => router.push('/(modal)/helpCenter')} />
        <SettingsRow icon="file-text" label="Terms of use" onPress={() => router.push('/(modal)/termsOfService')} />
        <SettingsRow icon="shield" label="Privacy policy" onPress={() => router.push('/(modal)/privacyPolicy')} />
      </ScrollView>
    </View>
  );
}
