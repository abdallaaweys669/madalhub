import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';
import { trackEventInteraction } from '@/api/trackEventInteraction';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { type EventCardModel } from '@/components/event/EventCard';
import { EventFeedCoverActions } from '@/components/event/feed/EventFeedCoverActions';
import {
  formatCompactLocationLine,
  formatEventFeedPriceAmount,
  formatRecommendedDateLine,
} from '@/components/event/feed/eventFeedCardUtils';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { buildEventScheduleLocationFields } from '@/utils/eventDisplay';
import { useThemeColors } from '@/theme';

const coverBannerImageStyle = {
  ...StyleSheet.absoluteFillObject,
  width: '100%',
  height: '100%',
} as const;

function getEventGoingCount(event: EventCardModel): number {
  return Math.max(0, Number(event.goingCount) || 0);
}

function getEventScheduleLocation(event: EventCardModel & { city?: string }) {
  return buildEventScheduleLocationFields({
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    locationName: event.locationName,
    locationAddress: event.locationAddress,
    city: event.city,
    isOnline: event.isOnline,
  });
}

type RecommendedEventCardProps = {
  event: EventCardModel;
  style?: StyleProp<ViewStyle>;
};

/** Horizontal mini card — thumbnail left, title/meta right (home Recommended + profile lists). */
export function RecommendedEventCard({ event, style }: RecommendedEventCardProps) {
  const colors = useThemeColors();
  const router = useGuardedRouter();
  const { isLoggedIn } = useAuth();

  const scheduleLocation = getEventScheduleLocation(event as EventCardModel & { city?: string });
  const dateLine = formatRecommendedDateLine(event.startsAt);
  const locationLine = formatCompactLocationLine(
    event as EventCardModel & { city?: string; locationAddress?: string | null },
    scheduleLocation.locationPrimary,
  );
  const priceLabel = formatEventFeedPriceAmount(event);
  const goingCount = getEventGoingCount(event);
  const attendeePreviews = event.attendeePreviews?.filter(Boolean).slice(0, 3) ?? [];
  const showGoing = goingCount > 0;

  useEffect(() => {
    if (isLoggedIn) trackEventInteraction(event.id, 'viewed');
  }, [event.id, isLoggedIn]);

  const openDetail = () => {
    if (isLoggedIn) trackEventInteraction(event.id, 'opened');
    router.push(`/events/${event.id}`);
  };

  const shareMessage = `${event.title}\n${dateLine}${locationLine ? `\n${locationLine}` : ''}`;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <Pressable onPress={openDetail} style={styles.thumb}>
        {event.coverImageUrl ? (
          <Image source={{ uri: event.coverImageUrl }} style={coverBannerImageStyle} resizeMode="cover" />
        ) : (
          <CoverPlaceholder
            letter={event.coverLetter ?? event.title}
            gradient={(event.coverGradient ?? DEFAULT_COVER_GRADIENT) as readonly [string, string]}
            borderRadius={10}
            style={styles.coverFill}
            letterSize={28}
          />
        )}
      </Pressable>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Pressable onPress={openDetail} style={styles.titlePress}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {event.title}
            </Text>
          </Pressable>
          <EventFeedCoverActions
            eventId={event.id}
            shareMessage={shareMessage}
            actionStyle="glass"
            size="compact"
            layout="inline"
          />
        </View>

        <Pressable onPress={openDetail} style={styles.metaBlock}>
          {dateLine ? (
            <View style={styles.metaRow}>
              <Feather name="clock" size={14} color={colors.primary} />
              <Text style={styles.metaLine} numberOfLines={1} ellipsizeMode="tail">
                {dateLine}
              </Text>
            </View>
          ) : null}
          {locationLine ? (
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={14} color={colors.primary} />
              <Text style={styles.metaLine} numberOfLines={1} ellipsizeMode="tail">
                {locationLine}
              </Text>
            </View>
          ) : null}
          <View style={styles.footerRow}>
            <Text style={[styles.price, { color: colors.primary }]}>{priceLabel}</Text>
            {showGoing ? (
              <View style={styles.goingWrap}>
                {attendeePreviews.length > 0 ? (
                  <View style={styles.avatarStack}>
                    {attendeePreviews.map((preview, index) => (
                      <MemberInitialAvatar
                        key={
                          preview.userId != null
                            ? String(preview.userId)
                            : `${preview.name}-${index}`
                        }
                        name={preview.name}
                        size={22}
                        borderWidth={2}
                        borderColor="#FFFFFF"
                        style={index > 0 ? styles.avatarOverlap : undefined}
                      />
                    ))}
                  </View>
                ) : null}
                <View
                  style={[
                    styles.goingBubble,
                    { backgroundColor: colors.primary },
                    attendeePreviews.length > 0 && styles.goingBubbleOverlap,
                  ]}
                >
                  <Text style={styles.goingBubbleText}>{goingCount}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumb: {
    width: 92,
    height: 92,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    flexShrink: 0,
  },
  coverFill: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titlePress: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaBlock: {
    gap: 4,
    paddingTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLine: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    flexShrink: 0,
  },
  goingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    marginLeft: -7,
  },
  goingBubble: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  goingBubbleOverlap: {
    marginLeft: -7,
  },
  goingBubbleText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
