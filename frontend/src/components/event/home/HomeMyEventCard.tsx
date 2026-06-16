import React from 'react';

import { type EventCardModel } from '@/components/event/EventCard';
import { KulanEventFeedCard } from '@/components/event/feed/KulanEventFeedCard';

type HomeMyEventCardProps = {
  event: EventCardModel;
  cardWidth?: number;
};

/** Home carousel wrapper around the shared feed card. */
export function HomeMyEventCard({ event, cardWidth }: HomeMyEventCardProps) {
  return (
    <KulanEventFeedCard
      event={event}
      variant="boxed"
      width={cardWidth}
    />
  );
}
