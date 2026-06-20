import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import useGuardedRouter from '@/hooks/useGuardedRouter';
import { COLORS } from '@/theme/colors';

export default function OrganizerStackHeader({ title, onBack, backgroundColor = '#F5F5F5' }) {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor,
      }}
    >
      <Pressable onPress={onBack || (() => router.back())} hitSlop={12} style={{ padding: 4 }}>
        <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
      </Pressable>
      <Text
        style={{
          flex: 1,
          textAlign: 'center',
          color: COLORS.textPrimary,
          fontSize: 20,
          fontWeight: '800',
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={{ width: 30 }} />
    </View>
  );
}
