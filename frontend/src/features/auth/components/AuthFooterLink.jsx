import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';

export default function AuthFooterLink({ text, linkLabel, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.text}>
        {text}{' '}
        <Text style={styles.link}>{linkLabel}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    marginBottom: 4,
  },
  text: {
    textAlign: 'center',
    color: '#5F6B7A',
    fontSize: 15,
    letterSpacing: 0.15,
  },
  link: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: COLORS.primary,
  },
});
