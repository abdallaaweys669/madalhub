import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { EventFeedCardVariant } from '@/components/event/feed/eventFeedTokens';

type EventFeedTagRowProps = {
  labels: string[];
  variant?: EventFeedCardVariant;
};

export function EventFeedTagRow({ labels, variant = 'boxed' }: EventFeedTagRowProps) {
  if (!labels.length) return null;

  const isFlat = variant === 'flat';

  return (
    <View style={[styles.tagRow, isFlat ? styles.tagRowFlat : styles.tagRowBoxed]}>
      {labels.map((label, index) => (
        <View
          key={`${label}-${index}`}
          style={[styles.tagPill, isFlat ? styles.tagPillFlat : styles.tagPillBoxed]}
        >
          <Text
            style={[styles.tagPillText, isFlat ? styles.tagPillTextFlat : styles.tagPillTextBoxed]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tagRowBoxed: {
    flexWrap: 'nowrap',
    gap: 5,
    marginBottom: 6,
    width: '100%',
  },
  tagRowFlat: {
    gap: 8,
    marginBottom: 6,
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  tagPillBoxed: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 7,
    paddingVertical: 5,
    alignItems: 'center',
  },
  tagPillFlat: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagPillText: {
    color: '#EA580C',
  },
  tagPillTextBoxed: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagPillTextFlat: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
});
