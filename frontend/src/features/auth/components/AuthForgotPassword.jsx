import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';

export default function AuthForgotPassword({ onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={styles.text}>Forgot password?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONT_JAKARTA_BOLD,
  },
});
