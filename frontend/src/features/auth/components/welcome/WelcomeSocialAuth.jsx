import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/loginSignin/authStyles';

function ContinueDivider({ label = 'or continue with' }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

function SocialChip({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
    >
      <Image source={icon} style={styles.chipIcon} resizeMode="contain" />
      <Text style={styles.chipLabel}>{label}</Text>
    </Pressable>
  );
}

export default function WelcomeSocialAuth({
  onGooglePress,
  onFacebookPress,
  onEmailPress,
  compact = false,
}) {
  return (
    <View style={styles.wrap}>
      <ContinueDivider />

      <View style={styles.socialRow}>
        <SocialChip
          icon={require('@/assets/google.png')}
          label="Google"
          onPress={onGooglePress}
        />
        <SocialChip
          icon={require('@/assets/facebook.png')}
          label="Facebook"
          onPress={onFacebookPress}
        />
      </View>

      <ContinueDivider label="or" />

      <Pressable
        onPress={onEmailPress}
        style={({ pressed }) => [
          styles.emailButton,
          compact && styles.emailButtonCompact,
          pressed && styles.chipPressed,
        ]}
      >
        <Text style={styles.emailLabel}>Sign up with Email</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ECECF0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#8B8E9C',
    letterSpacing: 0.2,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E3EA',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  chipPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  chipIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: 0.15,
  },
  emailButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emailButtonCompact: {
    height: 44,
  },
  emailLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
});
