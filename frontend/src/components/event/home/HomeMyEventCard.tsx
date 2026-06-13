import React from 'react';

import { type EventCardModel } from '@/components/event/EventCard';
import { KulanEventFeedCard } from '@/components/event/feed/KulanEventFeedCard';

import type { HomeEventTab } from '@/screens/home/YourEventsSection';

type HomeMyEventCardProps = {
  event: EventCardModel;
  activeTab: HomeEventTab;
  cardWidth?: number;
};

/** Home carousel wrapper around the shared feed card. */
export function HomeMyEventCard({ event, activeTab, cardWidth }: HomeMyEventCardProps) {
  const showJoinedBadge =
    activeTab === 'Joined' || Boolean((event as { isJoined?: boolean }).isJoined);

  return (
    <KulanEventFeedCard
      event={event}
      variant="boxed"
      width={cardWidth}
      showJoinedBadge={showJoinedBadge}
    />
  );
}
