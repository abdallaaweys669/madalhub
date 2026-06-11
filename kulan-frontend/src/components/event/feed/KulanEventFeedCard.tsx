import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import { type EventCardModel } from '@/components/event/EventCard';
import { buildEventFeedTagLabels } from '@/components/event/EventMetaBadgeRow';
import { EventFeedCompactMeta } from '@/components/event/feed/EventFeedCompactMeta';
import { EventFeedCoverActions } from '@/components/event/feed/EventFeedCoverActions';
import { EventFeedTagRow } from '@/components/event/feed/EventFeedTagRow';
import {
  formatCompactDateTimeLine,
  formatCompactLocationLine,
  formatEventFeedPriceAmount,
  isEventFeedPaid,
  resolveFeedImageHeight,
  toEventFeedCardModel,
} from '@/components/event/feed/eventFeedCardUtils';
import {
  EVENT_FEED_AVATAR_PREVIEW_COUNT,
  EVENT_FEED_AVATAR_SIZE,
  EVENT_FEED_BRAND_ORANGE,
  EVENT_FEED_COVER_ASPECT,
  EVENT_FEED_IMAGE_RADIUS,
  EVENT_FEED_IMAGE_RADIUS_FLAT,
  EVENT_FEED_LIST_HORIZONTAL_PAD,
  type EventFeedCardVariant,
} from '@/components/event/feed/eventFeedTokens';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { trackEventInteraction } from '@/api/trackEventInteraction';
import { buildEventScheduleLocationFields } from '@/utils/eventDisplay';
import { useThemeColors } from '@/theme';

export type { EventFeedCardVariant };

export type KulanEventFeedCardProps = {
  event: EventCardModel | Record<string, unknown>;
  variant?: EventFeedCardVariant;
  width?: number;
  showJoinedBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

const coverBannerImageStyle = {
  ...StyleSheet.absoluteFillObject,
  width: '100%',
  height: '100%',
} as const;

export function KulanEventFeedCard({
  event: rawEvent,
  variant = 'boxed',
  width,
  showJoinedBadge = false,
  style,
}: KulanEventFeedCardProps) {
  const colors = useThemeColors();
  const router = useGuardedRouter();
  const { isLoggedIn } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const event = toEventFeedCardModel(rawEvent as Record<string, unknown>);
  const isFlat = variant === 'flat';

  const flatWidth = width ?? screenWidth - EVENT_FEED_LIST_HORIZONTAL_PAD;
  const layoutWidth = isFlat ? flatWidth : (width ?? 300);
  const boxedWidth = layoutWidth;
  const imageHeight = resolveFeedImageHeight(variant, layoutWidth);

  const scheduleLocation = buildEventScheduleLocationFields({
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    locationName: event.locationName,
    locationAddress: event.locationAddress,
    city: (event as EventCardModel & { city?: string }).city,
    isOnline: event.isOnline,
  });

  const goingCountN = Math.max(0, Number(event.goingCount) || 0);
  const previews = event.attendeePreviews?.filter(Boolean) ?? [];
  const showPreviews = previews.length > 0;
  const showAnonymousGoing = !showPreviews && goingCountN > 0;
  const anonymousFaceCount = Math.min(
    EVENT_FEED_AVATAR_PREVIEW_COUNT,
    Math.max(1, goingCountN),
  );
  const urgencyLabel = event.urgencyLabel || event.statusChip?.label || null;
  const priceAmount = formatEventFeedPriceAmount(event);
  const showPaidSuffix = isEventFeedPaid(event);
  const tagLabels = buildEventFeedTagLabels({
    categoryName: event.categoryName || 'Featured',
    eventFormat: event.eventFormat,
    isOnline: event.isOnline,
    urgencyLabel,
  });
  const locationLine = formatCompactLocationLine(
    event as EventCardModel & { city?: string; locationAddress?: string | null },
    scheduleLocation.locationPrimary,
  );
  const dateTimeLine = formatCompactDateTimeLine(event.startsAt);

  useEffect(() => {
    if (isLoggedIn) trackEventInteraction(event.id, 'viewed');
  }, [event.id, isLoggedIn]);

  const openDetail = () => {
    if (isLoggedIn) trackEventInteraction(event.id, 'opened');
    router.push(`/events/${event.id}`);
  };

  return (
    <View
      style={[
        isFlat ? styles.cardFlat : styles.cardBoxed,
        !isFlat && {
          width: boxedWidth ?? 300,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        isFlat && { width: flatWidth, alignSelf: 'center' },
        style,
      ]}
    >
      <View
        style={[
          styles.imageFrame,
          isFlat ? styles.imageFrameMeetup : styles.imageFrameBoxed,
          !isFlat && imageHeight != null ? { height: imageHeight } : null,
        ]}
      >
        <Pressable onPress={openDetail} style={StyleSheet.absoluteFill}>
          {event.coverImageUrl ? (
            <Image
              source={{ uri: event.coverImageUrl }}
              style={coverBannerImageStyle}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imageFallback, { backgroundColor: colors.backgroundMuted }]}>
              <Text style={[styles.fallbackLetter, { color: colors.textSecondary }]}>
                {(event.coverLetter || event.title || '?').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>

        {showJoinedBadge ? (
          <View style={styles.heroTopLeft}>
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#15803D" />
              <Text style={styles.joinedBadgeText}>Joined</Text>
            </View>
          </View>
        ) : null}

        <EventFeedCoverActions
          eventId={event.id}
          shareMessage={`${event.title}\n${dateTimeLine || scheduleLocation.datePrimary}`}
          actionStyle="glass"
          size="comfortable"
        />
      </View>

      <Pressable onPress={openDetail} style={styles.body}>
        <EventFeedTagRow labels={tagLabels} variant={variant} />
        <Text
          numberOfLines={2}
          style={[styles.title, isFlat && styles.titleFlat, { color: colors.text }]}
        >
          {event.title}
        </Text>
        <EventFeedCompactMeta
          locationLine={locationLine}
          dateTimeLine={dateTimeLine}
          variant={variant}
        />
        <View style={styles.footer}>
          <View style={styles.priceWrap}>
            <Text style={[styles.priceAmount, isFlat && styles.priceAmountFlat]}>
              {priceAmount}
            </Text>
            {showPaidSuffix ? <Text style={styles.priceSuffix}> /Person</Text> : null}
          </View>
          <View style={styles.attendeeWrap}>
            <View style={styles.avatarStack}>
              {showPreviews ? (
                previews.slice(0, EVENT_FEED_AVATAR_PREVIEW_COUNT).map((preview, index) => (
                  <MemberInitialAvatar
                    key={
                      preview.userId != null
                        ? String(preview.userId)
                        : `${preview.name}-${index}`
                    }
                    name={preview.name}
                    size={EVENT_FEED_AVATAR_SIZE}
                    borderWidth={2}
                    borderColor="#FFFFFF"
                    style={index > 0 ? styles.avatarOverlap : undefined}
                  />
                ))
              ) : showAnonymousGoing ? (
                Array.from({ length: anonymousFaceCount }, (_, index) => (
                  <MemberInitialAvatar
                    key={`anon-${index}`}
                    name={`Attendee ${index + 1}`}
                    size={EVENT_FEED_AVATAR_SIZE}
                    borderWidth={2}
                    borderColor="#FFFFFF"
                    style={index > 0 ? styles.avatarOverlap : undefined}
                  />
                ))
              ) : null}
            </View>
            {goingCountN > 0 ? (
              <View
                style={[
                  styles.countBubble,
                  (showPreviews || showAnonymousGoing) && styles.countBubbleOverlap,
                ]}
              >
                <Text style={styles.countBubbleText}>{goingCountN}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardBoxed: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardFlat: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  imageFrame: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative',
  },
  imageFrameMeetup: {
    borderRadius: EVENT_FEED_IMAGE_RADIUS_FLAT,
    aspectRatio: EVENT_FEED_COVER_ASPECT,
    marginBottom: 10,
  },
  imageFrameBoxed: {
    borderRadius: EVENT_FEED_IMAGE_RADIUS,
    marginBottom: 12,
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: {
    fontSize: 34,
    fontWeight: '700',
  },
  heroTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    alignItems: 'flex-start',
  },
  joinedBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(240,253,244,0.95)',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinedBadgeText: {
    color: '#15803D',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  titleFlat: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 1,
    minWidth: 0,
  },
  priceAmount: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: EVENT_FEED_BRAND_ORANGE,
    letterSpacing: -0.4,
  },
  priceAmountFlat: {
    fontSize: 24,
    lineHeight: 28,
  },
  priceSuffix: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  attendeeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    marginLeft: -9,
  },
  countBubble: {
    minWidth: EVENT_FEED_AVATAR_SIZE,
    height: EVENT_FEED_AVATAR_SIZE,
    borderRadius: EVENT_FEED_AVATAR_SIZE / 2,
    paddingHorizontal: 6,
    backgroundColor: EVENT_FEED_BRAND_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  countBubbleOverlap: {
    marginLeft: -9,
  },
  countBubbleText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
