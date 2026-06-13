import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

const INITIAL_COLORS = ['#FF7A00', '#0EA5E9', '#8B5CF6', '#10B981', '#F43F5E', '#6366F1'] as const;

export function pickMemberInitialColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  return INITIAL_COLORS[hash % INITIAL_COLORS.length];
}

type MemberInitialAvatarProps = {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  borderWidth?: number;
};

/** Member face — always first letter of name (no profile photos in lists). */
export function MemberInitialAvatar({
  name,
  size = 32,
  style,
  borderColor = '#FFFFFF',
  borderWidth = 2,
}: MemberInitialAvatarProps) {
  const initial = String(name || '')
    .trim()
    .slice(0, 1)
    .toUpperCase() || '?';

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pickMemberInitialColor(name || '?'),
          borderColor,
          borderWidth,
        },
        style,
      ]}
      accessibilityLabel={name}
    >
      <Text style={[styles.letter, { fontSize: Math.max(12, Math.round(size * 0.42)) }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
