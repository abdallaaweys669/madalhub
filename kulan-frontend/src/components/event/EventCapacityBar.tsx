import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_ORANGE = '#FF7B3F';
const BRAND_ORANGE_LIGHT = '#FF8F3F';

type EventCapacityBarProps = {
  goingCount?: number;
  capacity?: number | null;
  eventState?: string;
  style?: StyleProp<ViewStyle>;
};

export function EventCapacityBar({
  goingCount = 0,
  capacity,
  eventState,
  style,
}: EventCapacityBarProps) {
  const capacityNum = typeof capacity === 'number' && capacity > 0 ? capacity : null;
  if (!capacityNum) return null;

  const joined = Math.max(0, Math.min(Number(goingCount) || 0, capacityNum));
  const isFull = eventState === 'fully-booked' || joined >= capacityNum;
  const fillPct = Math.min(100, Math.max(4, (joined / capacityNum) * 100));

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.joinedLine} numberOfLines={1}>
        <Text style={styles.joinedBold}>{joined}</Text>
        <Text style={styles.joinedMuted}>/{capacityNum} joined</Text>
      </Text>
      <View style={styles.track}>
        <LinearGradient
          colors={[BRAND_ORANGE, BRAND_ORANGE_LIGHT]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${fillPct}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
  },
  joinedLine: {
    marginBottom: 8,
  },
  joinedBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  joinedMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 8,
  },
});
