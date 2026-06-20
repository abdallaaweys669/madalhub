import React from 'react';
import { Pressable } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/theme';

export default function OrganizerFab() {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => router.push('/(organizer)/create-event')}
      style={({ pressed }) => ({
        position: 'absolute',
        right: 18,
        bottom: 72 + insets.bottom,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: pressed ? '#E56A2E' : colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOpacity: 0.35,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
      })}
      accessibilityRole="button"
      accessibilityLabel="Create event"
    >
      <Ionicons name="add" size={30} color="#FFFFFF" />
    </Pressable>
  );
}
