import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const EVENT_KIND_CHIP = {
  backgroundColor: '#FFF7ED',
  color: '#EA580C',
  borderColor: '#FFEDD5',
} as const;

export type EventKindChipVariant = 'category' | 'format' | 'delivery' | 'countdown';

type EventKindChipProps = {
  variant: EventKindChipVariant;
  label: string;
  isOnline?: boolean;
  /** Fit four chips evenly in one row without clipping. */
  flexCell?: boolean;
  style?: StyleProp<ViewStyle>;
};

function iconForVariant(variant: EventKindChipVariant, isOnline: boolean): keyof typeof Ionicons.glyphMap {
  switch (variant) {
    case 'category':
      return 'pricetag-outline';
    case 'format':
      return 'albums-outline';
    case 'delivery':
      return isOnline ? 'videocam-outline' : 'location-outline';
    case 'countdown':
      return 'alarm-outline';
    default:
      return 'pricetag-outline';
  }
}

/** Unified meta chip — same size, color, and box for category, format, delivery, countdown. */
export function EventKindChip({ variant, label, isOnline = false, flexCell = false, style }: EventKindChipProps) {
  const displayLabel = variant === 'delivery' && isOnline ? 'Online' : label;
  if (!displayLabel?.trim()) return null;

  return (
    <View style={[styles.chip, flexCell && styles.chipFlex, style]}>
      <Ionicons
        name={iconForVariant(variant, isOnline)}
        size={flexCell ? 10 : 11}
        color={EVENT_KIND_CHIP.color}
        style={styles.icon}
      />
      <Text
        style={[styles.label, flexCell && styles.labelFlex]}
        numberOfLines={1}
        adjustsFontSizeToFit={flexCell}
        minimumFontScale={flexCell ? 0.82 : 1}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: EVENT_KIND_CHIP.backgroundColor,
    borderWidth: 1,
    borderColor: EVENT_KIND_CHIP.borderColor,
    flexShrink: 0,
  },
  chipFlex: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingHorizontal: 5,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  icon: {
    flexShrink: 0,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.15,
    color: EVENT_KIND_CHIP.color,
  },
  labelFlex: {
    flex: 1,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
});
