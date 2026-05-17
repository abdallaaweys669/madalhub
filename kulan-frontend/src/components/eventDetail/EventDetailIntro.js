import React from 'react';
import { Text, View } from 'react-native';

import { EventFeedKindChipsRow } from '@/components/event/EventFeedKindChipsRow';
import { formatKeyToDisplayLabel } from '@/constants/eventFormatLabels';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { toDisplayTitle } from '@/utils/eventDisplay';

export default function EventDetailIntro({ event }) {
  const isOnline =
    typeof event.isOnline === 'boolean'
      ? event.isOnline
      : String(event.locationName || event.city || '')
          .trim()
          .toLowerCase() === 'online';
  const formatLabel = formatKeyToDisplayLabel(event.eventFormat);
  const showCountdown =
    Boolean(event.urgencyLabel) && event.eventState !== 'live' && event.eventState !== 'ended';

  return (
    <View style={styles.detailIntro}>
      <EventFeedKindChipsRow
        categoryName={event.categoryName}
        formatLabel={formatLabel}
        isOnline={isOnline}
        urgencyLabel={event.urgencyLabel}
        showCategory={Boolean(event.categoryName)}
        showFormat={Boolean(formatLabel)}
        showDelivery
        showCountdown={showCountdown}
        style={styles.detailIntroChips}
      />
      <Text style={styles.detailFeedTitle}>{toDisplayTitle(event.title)}</Text>
    </View>
  );
}
