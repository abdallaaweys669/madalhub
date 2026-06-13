import React from 'react';
import { Text, View } from 'react-native';

import { buildEventFeedBodyTagLabels } from '@/components/event/EventMetaBadgeRow';
import { EventFeedTagRow } from '@/components/event/feed/EventFeedTagRow';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { toDisplayTitle } from '@/utils/eventDisplay';

export default function EventDetailIntro({ event }) {
  const isOnline =
    typeof event.isOnline === 'boolean'
      ? event.isOnline
      : String(event.locationName || event.city || '')
          .trim()
          .toLowerCase() === 'online';

  const tagLabels = buildEventFeedBodyTagLabels({
    categoryName: event.categoryName,
    eventFormat: event.eventFormat,
    isOnline,
  });

  return (
    <View style={styles.detailIntro}>
      <EventFeedTagRow labels={tagLabels} variant="flat" />
      <Text style={styles.detailFeedTitle}>{toDisplayTitle(event.title)}</Text>
    </View>
  );
}
