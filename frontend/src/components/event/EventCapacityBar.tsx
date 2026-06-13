import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_ORANGE = '#FF7B3F';
const BRAND_ORANGE_LIGHT = '#FF8F3F';
const SEGMENTED_MAX = 10;

type EventCapacityBarProps = {
  goingCount?: number;
  capacity?: number | null;
  eventState?: string;
  style?: StyleProp<ViewStyle>;
  /** `detail` — inside Who's going card; `compact` — feed cards */
  variant?: 'detail' | 'compact';
};

function getSpotsChip(seatsLeft: number, isFull: boolean, capacity: number) {
  if (isFull || seatsLeft <= 0) {
    return { label: 'Fully booked', tone: 'full' as const };
  }
  const almostFullThreshold = Math.max(3, Math.ceil(capacity * 0.1));
  if (seatsLeft <= almostFullThreshold) {
    return {
      label: seatsLeft === 1 ? '1 spot left' : 'Almost full',
      tone: 'urgent' as const,
    };
  }
  return {
    label: seatsLeft === 1 ? '1 spot left' : `${seatsLeft} spots left`,
    tone: 'normal' as const,
  };
}

function SegmentedTrack({ joined, capacity }: { joined: number; capacity: number }) {
  return (
    <View style={styles.segmentsRow}>
      {Array.from({ length: capacity }, (_, index) => {
        const filled = index < joined;
        return filled ? (
          <LinearGradient
            key={`seg-${index}`}
            colors={[BRAND_ORANGE, BRAND_ORANGE_LIGHT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.segmentFilled}
          />
        ) : (
          <View key={`seg-${index}`} style={styles.segmentEmpty} />
        );
      })}
    </View>
  );
}

function SmoothTrack({ fillPct }: { fillPct: number }) {
  return (
    <View style={styles.track}>
      <LinearGradient
        colors={[BRAND_ORANGE, BRAND_ORANGE_LIGHT]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.fill, { width: `${fillPct}%` }]}
      />
    </View>
  );
}

export function EventCapacityBar({
  goingCount = 0,
  capacity,
  eventState,
  style,
  variant = 'compact',
}: EventCapacityBarProps) {
  const capacityNum = typeof capacity === 'number' && capacity > 0 ? capacity : null;
  if (!capacityNum) return null;

  const joined = Math.max(0, Math.min(Number(goingCount) || 0, capacityNum));
  const isFull = eventState === 'fully-booked' || joined >= capacityNum;
  const seatsLeft = Math.max(0, capacityNum - joined);
  const fillPct = Math.min(100, Math.max(joined > 0 ? 4 : 0, (joined / capacityNum) * 100));
  const chip = getSpotsChip(seatsLeft, isFull, capacityNum);
  const useSegments = capacityNum <= SEGMENTED_MAX;

  const chipStyle =
    chip.tone === 'full'
      ? styles.chipFull
      : chip.tone === 'urgent'
        ? styles.chipUrgent
        : styles.chipNormal;

  const chipTextStyle =
    chip.tone === 'full'
      ? styles.chipTextFull
      : chip.tone === 'urgent'
        ? styles.chipTextUrgent
        : styles.chipTextNormal;

  return (
    <View style={[variant === 'detail' ? styles.wrapDetail : styles.wrapCompact, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.joinedLine} numberOfLines={1}>
          <Text style={styles.joinedBold}>{joined}</Text>
          <Text style={styles.joinedMuted}> joined</Text>
          <Text style={styles.joinedMuted}> · </Text>
          <Text style={styles.joinedMuted}>{capacityNum} capacity</Text>
        </Text>
        <View style={[styles.chip, chipStyle]}>
          <Text style={[styles.chipText, chipTextStyle]}>{chip.label}</Text>
        </View>
      </View>

      {useSegments ? (
        <SegmentedTrack joined={joined} capacity={capacityNum} />
      ) : (
        <SmoothTrack fillPct={fillPct} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapCompact: {
    marginTop: 10,
  },
  wrapDetail: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  joinedLine: {
    flex: 1,
    minWidth: 0,
  },
  joinedBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  joinedMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 0,
  },
  chipNormal: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFD9C2',
  },
  chipUrgent: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  chipFull: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  chipTextNormal: {
    color: '#FF7B3F',
  },
  chipTextUrgent: {
    color: '#E11D48',
  },
  chipTextFull: {
    color: '#64748B',
  },
  track: {
    height: 11,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 0,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  segmentFilled: {
    flex: 1,
    height: 11,
    borderRadius: 999,
  },
  segmentEmpty: {
    flex: 1,
    height: 11,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
});
