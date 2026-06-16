import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS } from '@/constants/loginSignin/authStyles';

export default function WelcomeAuthActions({ onGetStartedPress, compact = false }) {
  return (
    <Pressable
      onPress={onGetStartedPress}
      style={({ pressed }) => [
        styles.primaryButton,
        compact && styles.primaryButtonCompact,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.primaryLabel}>Get started</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    width: '100%',
    alignSelf: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonCompact: {
    height: 48,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
