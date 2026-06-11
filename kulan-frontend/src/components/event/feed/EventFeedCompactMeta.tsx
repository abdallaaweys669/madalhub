import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { EventFeedCardVariant } from '@/components/event/feed/eventFeedTokens';
import { EVENT_FEED_BRAND_ORANGE } from '@/components/event/feed/eventFeedTokens';

export type EventFeedCompactMetaProps = {
  locationLine?: string;
  dateTimeLine?: string;
  variant?: EventFeedCardVariant;
  style?: StyleProp<ViewStyle>;
};

export function EventFeedCompactMeta({
  locationLine,
  dateTimeLine,
  variant = 'boxed',
  style,
}: EventFeedCompactMetaProps) {
  const showLocation = Boolean(locationLine);
  const showDateTime = Boolean(dateTimeLine);
  const isFlat = variant === 'flat';

  if (!showLocation && !showDateTime) return null;

  if (isFlat) {
    return (
      <View style={[styles.wrapInline, style]}>
        {showDateTime ? (
          <View style={[styles.segment, showLocation && styles.dateSegment]}>
            <Feather name="clock" size={22} color={EVENT_FEED_BRAND_ORANGE} />
            <Text style={styles.metaTextFlat} numberOfLines={1}>
              {dateTimeLine}
            </Text>
          </View>
        ) : null}
        {showLocation ? (
          <View style={[styles.segment, styles.locationSegment]}>
            <Feather name="map-pin" size={22} color={EVENT_FEED_BRAND_ORANGE} />
            <Text style={styles.metaTextFlat} numberOfLines={1} ellipsizeMode="tail">
              {locationLine}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrapStacked, style]}>
      {showDateTime ? (
        <View style={styles.row}>
          <Feather name="clock" size={18} color={EVENT_FEED_BRAND_ORANGE} style={styles.icon} />
          <Text style={styles.metaTextBoxed}>{dateTimeLine}</Text>
        </View>
      ) : null}
      {showLocation ? (
        <View style={styles.row}>
          <Feather name="map-pin" size={18} color={EVENT_FEED_BRAND_ORANGE} style={styles.icon} />
          <Text style={styles.metaTextBoxed}>{locationLine}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapInline: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 10,
    width: '100%',
  },
  wrapStacked: {
    gap: 6,
    marginTop: 4,
    marginBottom: 12,
    width: '100%',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  dateSegment: {
    maxWidth: '48%',
  },
  locationSegment: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    width: '100%',
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  metaTextFlat: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '500',
    color: '#6B7280',
    flexShrink: 1,
  },
  metaTextBoxed: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});
