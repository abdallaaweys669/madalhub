import React from 'react';
import { Text, View } from 'react-native';

import {
  buildEventMetaBadgeLabels,
  EventMetaBadgeRow,
} from '@/components/event/EventMetaBadgeRow';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { toDisplayTitle } from '@/utils/eventDisplay';

export default function EventDetailIntro({ event }) {
  const isOnline =
    typeof event.isOnline === 'boolean'
      ? event.isOnline
      : String(event.locationName || event.city || '')
          .trim()
          .toLowerCase() === 'online';

  const badgeLabels = buildEventMetaBadgeLabels({
    categoryName: event.categoryName,
    eventFormat: event.eventFormat,
    isOnline,
  });

  return (
    <View style={styles.detailIntro}>
      <EventMetaBadgeRow labels={badgeLabels} style={styles.detailIntroChips} />
      <Text style={styles.detailFeedTitle}>{toDisplayTitle(event.title)}</Text>
    </View>
  );
}
