import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { EventKindChip } from '@/components/event/EventKindChip';

type EventFeedKindChipsRowProps = {
  categoryName?: string | null;
  formatLabel?: string | null;
  isOnline?: boolean;
  urgencyLabel?: string | null;
  showCategory?: boolean;
  showFormat?: boolean;
  showDelivery?: boolean;
  showCountdown?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Four equal chips in one row — all visible without horizontal scroll. */
export function EventFeedKindChipsRow({
  categoryName,
  formatLabel,
  isOnline = false,
  urgencyLabel,
  showCategory = false,
  showFormat = false,
  showDelivery = true,
  showCountdown = false,
  style,
}: EventFeedKindChipsRowProps) {
  const hasRow =
    (showCategory && categoryName) ||
    (showFormat && formatLabel) ||
    showDelivery ||
    (showCountdown && urgencyLabel);

  if (!hasRow) return null;

  return (
    <View style={[chipRowStyles.row, style]}>
      {showCategory && categoryName ? (
        <EventKindChip variant="category" label={categoryName} flexCell />
      ) : null}
      {showFormat && formatLabel ? <EventKindChip variant="format" label={formatLabel} flexCell /> : null}
      {showDelivery ? <EventKindChip variant="delivery" label="In person" isOnline={isOnline} flexCell /> : null}
      {showCountdown && urgencyLabel ? (
        <EventKindChip variant="countdown" label={urgencyLabel} flexCell />
      ) : null}
    </View>
  );
}

const chipRowStyles = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'stretch' as const,
    gap: 4,
    width: '100%' as const,
    marginBottom: 8,
  },
};
