import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { KulanEventFeedCard } from '@/components/event/feed/KulanEventFeedCard';
import { EVENT_FEED_LIST_HORIZONTAL_PAD } from '@/components/event/feed/eventFeedTokens';

export type ExploreEventChip = {
  label: string;
  type: 'category' | 'format' | 'mode';
  variant?: string;
};

export type ExploreEventCardModel = {
  id: string;
  title: string;
  dateTimeLabel: string;
  dateLabel?: string;
  timeLabel?: string;
  location: string;
  startsAt?: string;
  endsAt?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  city?: string | null;
  isOnline?: boolean;
  coverImageUrl?: string | null;
  coverLetter?: string;
  coverGradient?: readonly [string, string];
  goingLabel: string;
  goingCount?: number;
  attendeePreviews?: { userId: number | null; name: string; avatarUrl: string | null }[];
  mode: 'online' | 'in-person';
  statusChip?: { label: string; variant: string };
  urgencyLabel?: string | null;
  categoryName?: string | null;
  eventChips?: ExploreEventChip[];
  categoryTags?: string[];
  eventState?: 'upcoming' | 'live' | 'fully-booked' | 'closed' | 'ended';
  priceLabel?: string;
  priceType?: 'Free' | 'Paid' | string;
  priceAmount?: number | null;
  eventFormat?: string | null;
};

type ExploreEventCardProps = {
  event: ExploreEventCardModel;
};

/** Explore / profile list wrapper around the shared feed card. */
export function ExploreEventCard({ event }: ExploreEventCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - EVENT_FEED_LIST_HORIZONTAL_PAD;

  return (
    <KulanEventFeedCard
      event={event}
      variant="boxed"
      width={cardWidth}
      style={styles.cardSpacing}
    />
  );
}

const styles = StyleSheet.create({
  cardSpacing: {
    marginBottom: 14,
    alignSelf: 'center',
  },
});
