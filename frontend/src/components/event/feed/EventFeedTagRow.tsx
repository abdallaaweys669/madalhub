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
          style={[
            styles.tagPill,
            isFlat ? styles.tagPillFlat : styles.tagPillBoxed,
            index === 0 && styles.tagPillLead,
          ]}
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
    flexWrap: 'nowrap',
    alignItems: 'center',
    width: '100%',
  },
  tagRowBoxed: {
    gap: 6,
    marginBottom: 6,
  },
  tagRowFlat: {
    gap: 5,
    marginBottom: 5,
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
    flexShrink: 0,
  },
  tagPillLead: {
    flexShrink: 1,
    minWidth: 0,
  },
  tagPillBoxed: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagPillFlat: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    backgroundColor: '#FFFBF7',
  },
  tagPillText: {
    color: '#EA580C',
    textAlign: 'center',
  },
  tagPillTextBoxed: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
  },
  tagPillTextFlat: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
  },
});
