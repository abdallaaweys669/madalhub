import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/theme';

const META_ICON_SIZE = 14;
const ICON_TEXT_GAP = 5;

type EventMetaProps = {
  details: string;
};

function splitDetails(details: string): { datePart: string; locationPart: string } {
  const parts = details.split('·').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { datePart: parts[0], locationPart: parts.slice(1).join(' · ') };
  }
  return { datePart: details.trim(), locationPart: '' };
}

export function EventMeta({ details }: EventMetaProps) {
  const colors = useThemeColors();
  const { datePart, locationPart } = useMemo(() => splitDetails(details), [details]);
  const metaColor = colors.textSecondary;
  const iconColor = metaColor;

  return (
    <View style={styles.wrap}>
      {locationPart ? (
        <View style={styles.column}>
          <View style={styles.segment} importantForAccessibility="no">
            <Ionicons
              name="calendar-outline"
              size={META_ICON_SIZE}
              color={iconColor}
              style={styles.segmentIcon}
            />
            <Text style={[styles.meta, { color: metaColor }]} numberOfLines={1}>
              {datePart}
            </Text>
          </View>
          <View style={styles.segment} importantForAccessibility="no">
            <Ionicons
              name="location-outline"
              size={META_ICON_SIZE}
              color={iconColor}
              style={styles.segmentIcon}
            />
            <Text style={[styles.meta, { color: metaColor }]} numberOfLines={1}>
              {locationPart}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.segment} importantForAccessibility="no">
          <Ionicons
            name="calendar-outline"
            size={META_ICON_SIZE}
            color={iconColor}
            style={styles.segmentIcon}
          />
          <Text style={[styles.meta, { color: metaColor }]} numberOfLines={2}>
            {datePart}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  column: {
    gap: 4,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '100%',
    flexShrink: 1,
  },
  segmentIcon: {
    marginRight: ICON_TEXT_GAP,
    marginTop: 3,
  },
  meta: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
});
