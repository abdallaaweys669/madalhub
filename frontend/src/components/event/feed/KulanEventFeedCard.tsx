import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import useAuth from '@/auth/useAuth';
import { type EventCardModel } from '@/components/event/EventCard';
import { EventCoverBanner } from '@/components/event/EventCoverBanner';
import { buildEventFeedBodyTagLabels } from '@/components/event/EventMetaBadgeRow';
import { EventFeedCompactMeta } from '@/components/event/feed/EventFeedCompactMeta';
import { EventFeedCoverActions } from '@/components/event/feed/EventFeedCoverActions';
import { EventFeedTagRow } from '@/components/event/feed/EventFeedTagRow';
import {
  formatCompactLocationLine,
  formatEventFeedPriceAmount,
  formatRecommendedDateLine,
  isEventFeedPaid,
  resolveFeedImageHeight,
  toEventFeedCardModel,
} from '@/components/event/feed/eventFeedCardUtils';
import {
  EVENT_FEED_AVATAR_PREVIEW_COUNT,
  EVENT_FEED_AVATAR_SIZE,
  EVENT_FEED_AVATAR_SIZE_FLAT,
  EVENT_FEED_BRAND_ORANGE,
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
  style?: StyleProp<ViewStyle>;
};

export function KulanEventFeedCard({
  event: rawEvent,
  variant = 'boxed',
  width,
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
  const urgencyLabel = String(
    event.urgencyLabel || event.statusChip?.label || '',
  ).trim() || null;
  const priceAmount = formatEventFeedPriceAmount(event);
  const showPaidSuffix = isEventFeedPaid(event);
  const bodyTagLabels = buildEventFeedBodyTagLabels({
    categoryName: event.categoryName || 'Featured',
    eventFormat: event.eventFormat,
    isOnline: event.isOnline,
  });
  const locationLine = formatCompactLocationLine(
    event as EventCardModel & { city?: string; locationAddress?: string | null },
    scheduleLocation.locationPrimary,
  );
  const dateTimeLine = formatRecommendedDateLine(event.startsAt);

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
      <EventCoverBanner
        preset={isFlat ? 'feed-flat' : 'feed-boxed'}
        height={!isFlat ? imageHeight : undefined}
        coverImageUrl={event.coverImageUrl}
        coverLetter={event.coverLetter}
        title={event.title}
        coverGradient={event.coverGradient as readonly [string, string] | undefined}
        onPress={openDetail}
      >
        {urgencyLabel ? (
          <View style={styles.urgencyOverlay}>
            <Text style={styles.urgencyOverlayText} numberOfLines={1}>
              {urgencyLabel}
            </Text>
          </View>
        ) : null}

        <EventFeedCoverActions
          eventId={event.id}
          shareMessage={`${event.title}\n${dateTimeLine || scheduleLocation.datePrimary}`}
          actionStyle="glass"
          size="comfortable"
        />
      </EventCoverBanner>

      <Pressable onPress={openDetail} style={[styles.body, isFlat && styles.bodyFlat]}>
        <EventFeedTagRow labels={bodyTagLabels} variant={variant} />
        {isFlat ? (
          <Text
            numberOfLines={1}
            style={[styles.title, styles.titleFlat, { color: colors.text }]}
          >
            {event.title}
          </Text>
        ) : null}
        {!isFlat ? (
          <Text
            numberOfLines={2}
            style={[styles.title, { color: colors.text }]}
          >
            {event.title}
          </Text>
        ) : null}
        <EventFeedCompactMeta
          locationLine={locationLine}
          dateTimeLine={dateTimeLine}
          variant={variant}
        />
        <View style={[styles.footer, isFlat && styles.footerFlat]}>
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
                    size={isFlat ? EVENT_FEED_AVATAR_SIZE_FLAT : EVENT_FEED_AVATAR_SIZE}
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
                    size={isFlat ? EVENT_FEED_AVATAR_SIZE_FLAT : EVENT_FEED_AVATAR_SIZE}
                    borderWidth={2}
                    borderColor="#FFFFFF"
                    style={index > 0 ? styles.avatarOverlap : undefined}
                  />
                ))
              ) : null}
            </View>
            {goingCountN > 0 ? (
              <View style={styles.attendeeMeta}>
                <View
                  style={[
                    styles.countBubble,
                    isFlat && styles.countBubbleFlat,
                    (showPreviews || showAnonymousGoing) && styles.countBubbleOverlap,
                  ]}
                >
                  <Text style={styles.countBubbleText}>{goingCountN}</Text>
                </View>
                {isFlat ? <Text style={[styles.goingHint, styles.goingHintFlat]}>going</Text> : null}
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
    marginBottom: 14,
  },
  urgencyOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 2,
    maxWidth: '52%',
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  urgencyOverlayText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 2,
  },
  bodyFlat: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  titleFlat: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  footerFlat: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F2',
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
    fontSize: 20,
    lineHeight: 24,
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
  attendeeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goingHint: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  goingHintFlat: {
    fontSize: 12,
    lineHeight: 15,
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
  countBubbleFlat: {
    minWidth: EVENT_FEED_AVATAR_SIZE_FLAT,
    height: EVENT_FEED_AVATAR_SIZE_FLAT,
    borderRadius: EVENT_FEED_AVATAR_SIZE_FLAT / 2,
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
