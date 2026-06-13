import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/features/onboarding/tokens/colors';

export default function OnboardingProgress({ step, total = 4 }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const current = i + 1;
        const active = current <= step;
        return <View key={current} style={[styles.seg, active && styles.segActive]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  seg: { flex: 1, height: 4, borderRadius: 8, backgroundColor: colors.progressBg },
  segActive: { backgroundColor: colors.progressActive },
});
