import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { EventFeedCardVariant } from '@/components/event/feed/eventFeedTokens';
import { EVENT_FEED_BRAND_ORANGE } from '@/components/event/feed/eventFeedTokens';

const FLAT_ICON = 18;
const FLAT_CHIP = 26;

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
  const iconSize = isFlat ? FLAT_ICON : 18;

  if (!showLocation && !showDateTime) return null;

  const wrapStyle = isFlat ? styles.wrapFlat : styles.wrapBoxed;
  const textStyle = isFlat ? styles.metaTextFlat : styles.metaTextBoxed;

  return (
    <View style={[wrapStyle, style]}>
      {showDateTime ? (
        <View style={styles.row}>
          {isFlat ? (
            <View style={styles.iconChipFlat}>
              <Feather name="clock" size={FLAT_ICON} color={EVENT_FEED_BRAND_ORANGE} />
            </View>
          ) : (
            <Feather name="clock" size={iconSize} color={EVENT_FEED_BRAND_ORANGE} style={styles.icon} />
          )}
          <Text style={textStyle} numberOfLines={1} ellipsizeMode="tail">
            {dateTimeLine}
          </Text>
        </View>
      ) : null}
      {showLocation ? (
        <View style={styles.row}>
          {isFlat ? (
            <View style={styles.iconChipFlat}>
              <Feather name="map-pin" size={FLAT_ICON} color={EVENT_FEED_BRAND_ORANGE} />
            </View>
          ) : (
            <Feather name="map-pin" size={iconSize} color={EVENT_FEED_BRAND_ORANGE} style={styles.icon} />
          )}
          <Text style={textStyle} numberOfLines={1} ellipsizeMode="tail">
            {locationLine}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapBoxed: {
    gap: 6,
    marginTop: 4,
    marginBottom: 12,
    width: '100%',
  },
  wrapFlat: {
    gap: 5,
    marginTop: 0,
    marginBottom: 0,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  icon: {
    flexShrink: 0,
  },
  iconChipFlat: {
    width: FLAT_CHIP,
    height: FLAT_CHIP,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metaTextFlat: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    color: '#4B5563',
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
