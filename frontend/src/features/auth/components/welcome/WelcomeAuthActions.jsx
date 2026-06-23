import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      <View style={styles.iconCircle}>
        <Ionicons name="sparkles" size={18} color={COLORS.primary} />
      </View>
      <View style={styles.labelBlock}>
        <Text style={styles.primaryLabel}>Get Started</Text>
        <Text style={styles.primarySubLabel}>Explore events near you</Text>
      </View>
      <View style={styles.iconCircle}>
        <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    height: 58,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryButtonCompact: {
    height: 52,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  primarySubLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
  },
});
