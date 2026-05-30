import React from 'react';
import { Image, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '@/theme/colors';

export function initialsFromName(name) {
  if (!name || typeof name !== 'string') return 'OR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function formatCount(value) {
  const num = Number(value || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

export function formatRating(value) {
  if (value == null || Number.isNaN(Number(value))) return '0';
  return Number(value).toFixed(1);
}

/** Stats row tile — same visual as organizer self profile (plain row, no cards). */
export function StatTile({ label, value }) {
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

/** Circular / initials avatar — shared between self + public organizer profiles. */
export function OrganizerAvatar({ uri, name }) {
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

/**
 * Location / website / contact row with icon chip.
 * @param {boolean} [skipEmpty] — if true, render nothing when value is empty (public About).
 */
export function OrganizerInfoRow({ icon, label, value, skipEmpty }) {
  const effective = typeof value === 'string' ? value.trim() : value;
  if (skipEmpty && !effective) return null;

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
          {effective || 'Not set'}
        </Text>
      </View>
    </View>
  );
}
