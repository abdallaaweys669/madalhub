import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import KulanLogo from '@/assets/kulan_logo.svg';

const KULAN_AT_PATTERN = /^(.+?)\s+at\s+Kulan$/i;

/**
 * Renders a one-line subtitle; replaces trailing "at Kulan" with the app wordmark.
 */
export default function AttendeeSubtitle({ text, style, logoHeight = 14 }) {
  if (typeof text !== 'string' || !text.trim()) return null;

  const trimmed = text.trim();
  const match = trimmed.match(KULAN_AT_PATTERN);
  const logoWidth = Math.round(logoHeight * 3.35);

  if (match) {
    return (
      <View style={styles.row}>
        <Text style={[styles.text, style]} numberOfLines={1}>
          {match[1].trim()} at{' '}
        </Text>
        <KulanLogo
          width={logoWidth}
          height={logoHeight}
          preserveAspectRatio="xMidYMid meet"
          accessibilityLabel="Kulan"
        />
      </View>
    );
  }

  return (
    <Text style={[styles.text, style]} numberOfLines={1}>
      {trimmed}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 18,
  },
});
