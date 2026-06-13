import React from 'react';
import { Pressable, Text } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/loginSignin/authStyles';

export default function BackToWelcomeRow() {
  const router = useGuardedRouter();

  return (
    <Pressable
      onPress={() => router.replace('/(auth)/welcome')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 18,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: pressed ? COLORS.primary : 'rgba(255, 123, 63, 0.28)',
        backgroundColor: pressed ? 'rgba(255, 123, 63, 0.08)' : 'rgba(255, 123, 63, 0.04)',
      })}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="link"
      accessibilityLabel="Back to welcome screen"
    >
      <Ionicons name="chevron-back" size={20} color={COLORS.primary} style={{ marginRight: 4 }} />
      <Text
        style={{
          color: COLORS.primary,
          fontWeight: '600',
          fontSize: 15,
          letterSpacing: -0.15,
        }}
      >
        Back to welcome
      </Text>
    </Pressable>
  );
}
