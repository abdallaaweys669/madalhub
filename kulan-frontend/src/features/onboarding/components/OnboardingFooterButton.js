import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '@/features/onboarding/tokens/colors';

export default function OnboardingFooterButton({ label = 'Continue', disabled, onPress }) {
  return (
    <View style={styles.footer}>
      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 50, backgroundColor: colors.bg },
  button: { width: '100%', backgroundColor: colors.primary, paddingVertical: 18, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
