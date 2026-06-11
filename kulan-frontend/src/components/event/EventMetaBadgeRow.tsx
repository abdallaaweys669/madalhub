import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatKeyToDisplayLabel } from '@/constants/eventFormatLabels';

export function buildEventMetaBadgeLabels(input: {
  categoryName?: string | null;
  eventFormat?: string | null;
  isOnline?: boolean;
  mode?: 'online' | 'in-person';
}): string[] {
  const badges: string[] = [];
  const category = String(input.categoryName || '').trim();
  if (category) badges.push(category);

  const formatLabel = formatKeyToDisplayLabel(input.eventFormat);
  if (formatLabel) badges.push(formatLabel);

  const isOnline =
    input.mode != null ? input.mode === 'online' : Boolean(input.isOnline);
  badges.push(isOnline ? 'Online' : 'In-person');
  return badges;
}

/** Feed card tags: category, format, delivery mode, urgency (Meetup-style text row). */
export function buildEventFeedTagLabels(input: {
  categoryName?: string | null;
  eventFormat?: string | null;
  isOnline?: boolean;
  urgencyLabel?: string | null;
  mode?: 'online' | 'in-person';
}): string[] {
  const badges: string[] = [];

  const category = String(input.categoryName || '').trim();
  if (category) badges.push(category);

  const formatLabel = formatKeyToDisplayLabel(input.eventFormat);
  if (formatLabel) badges.push(formatLabel);

  const isOnline =
    input.mode != null ? input.mode === 'online' : Boolean(input.isOnline);
  badges.push(isOnline ? 'Online' : 'In-person');

  const urgency = String(input.urgencyLabel || '').trim();
  if (urgency) badges.push(urgency);

  return badges;
}

/** @deprecated Use buildEventFeedTagLabels */
export const buildHomeEventTagLabels = buildEventFeedTagLabels;

type EventMetaBadgeRowProps = {
  labels: string[];
  style?: StyleProp<ViewStyle>;
};

export function EventMetaBadgeRow({ labels, style }: EventMetaBadgeRowProps) {
  if (!labels.length) return null;

  return (
    <View style={[styles.row, style]}>
      {labels.map((label, index) => (
        <View key={`${label}-${index}`} style={styles.pill}>
          <Text style={styles.text}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: '#BE123C',
    letterSpacing: 0.2,
  },
});
