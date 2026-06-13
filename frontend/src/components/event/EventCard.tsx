import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import useAuth from '@/auth/useAuth';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { spacing, useThemeColors } from '@/theme';
import { DEFAULT_COVER_GRADIENT, likeEvent, unlikeEvent } from '@/api/events';
import { formatKeyToDisplayLabel } from '@/constants/eventFormatLabels';
import { EventCapacityBar } from '@/components/event/EventCapacityBar';
import { EventFeedKindChipsRow } from '@/components/event/EventFeedKindChipsRow';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';

const OVERLAY_ACTION_ICON = '#3F3F46';
const BRAND_TAG_BG = '#FFF7ED';
const BRAND_TAG_FG = '#EA580C';

/** Light blur so cover art stays recognizable behind ended / fully-booked stamps. */
const BANNER_STATUS_BLUR_RADIUS = 3;

const BANNER_OVERLAY_IMAGES = {
  ended: require('../../assets/ended.png'),
  closed: require('../../assets/Closed.png'),
  'fully-booked': require('../../assets/fully-booked.png'),
} as const;

export type EventCardModel = {
  id: string;
  title: string;
  details: string;
  image: ImageSourcePropType | null;
  coverImageUrl?: string | null;
  coverLetter?: string;
  coverGradient?: readonly [string, string];
  goingCount?: number;
  capacity?: number | null;
  attendeePreviews?: { userId: number | null; name: string; avatarUrl: string | null }[];
  statusChip?: { label: string; variant: string };
  urgencyLabel?: string | null;
  categoryName?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  isOnline?: boolean;
  eventFormat?: string | null;
  description?: string;
  organizerName?: string;
  eventState?: 'upcoming' | 'live' | 'fully-booked' | 'closed' | 'ended';
  statusLine?: string | null;
  registrationLabel?: string | null;
  canJoin?: boolean;
  canWaitlist?: boolean;
  discoverySignals?: { key: string; label: string; tone: 'hot' | 'soon' }[];
  priceType?: 'Free' | 'Paid' | string;
  priceAmount?: number | null;
  likeCount?: number;
  isLiked?: boolean;
  locationName?: string | null;
  locationAddress?: string | null;
};

type ChipProps = {
  label: string;
  bg: string;
  fg: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

function Chip({ label, bg, fg, icon }: ChipProps) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {icon && <Ionicons name={icon} size={11} color={fg} style={styles.chipIcon} />}
      <Text style={[styles.chipLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

function EventPriceBadge({
  isFree,
  label,
  variant = 'banner',
}: {
  isFree: boolean;
  label: string;
  variant?: 'banner' | 'inline';
}) {
  const displayLabel = isFree ? 'Free' : label;
  const iconName = isFree ? 'ticket-outline' : 'card-outline';
  const iconSize = variant === 'banner' ? 13 : 12;
  const pillStyle = variant === 'banner' ? styles.priceBadgePillBanner : styles.priceBadgePillInline;
  const textStyle = variant === 'banner' ? styles.priceBadgeTextBanner : styles.priceBadgeTextInline;
  const iconWrapStyle = variant === 'banner' ? styles.priceBadgeIconBanner : styles.priceBadgeIconInline;

  return (
    <LinearGradient
      colors={isFree ? ['#FF6A00', '#FF8F3F'] : ['#1E293B', '#334155']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={pillStyle}
    >
      <View style={iconWrapStyle}>
        <Ionicons name={iconName} size={iconSize} color="#FFFFFF" />
      </View>
      <Text style={textStyle}>{displayLabel}</Text>
    </LinearGradient>
  );
}

const STATUS_VARIANT_STYLES: Record<string, { bg: string; fg: string; icon?: keyof typeof Ionicons.glyphMap }> = {
  live: { bg: '#DCFCE7', fg: '#15803D', icon: 'radio-button-on' },
  today: { bg: '#FEF3C7', fg: '#D97706', icon: 'time' },
  urgent: { bg: '#FFE4E6', fg: '#BE123C', icon: 'warning' },
  'sold-out': { bg: '#FEF2F2', fg: '#B91C1C', icon: 'close-circle' },
  ended: { bg: '#FEE2E2', fg: '#B91C1C', icon: 'stop' },
  closed: { bg: '#FEF2F2', fg: '#B91C1C', icon: 'close-circle' },
  neutral: { bg: '#FFEDD5', fg: '#C2410C', icon: 'calendar-outline' },
};

type EventKind = 'online' | 'physical';

function parseEventKind(event: EventCardModel): EventKind {
  if (typeof event.isOnline === 'boolean') return event.isOnline ? 'online' : 'physical';
  const [, ...rest] = event.details.split('·').map((s) => s.trim());
  const locationLine = rest.join(' · ') || '';
  return locationLine.toLowerCase() === 'online' ? 'online' : 'physical';
}

function formatTimeLabel(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function parseLocationFromDetails(details: string): string {
  const [, ...rest] = details.split('·').map((part) => part.trim()).filter(Boolean);
  return rest.join(' · ');
}

function utcDay(d: Date) {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildCardMetaGrid(
  startsAt: string | undefined,
  endsAt: string | undefined | null,
  venueLine: string,
  organizerName: string,
  isOnline: boolean,
) {
  const s = startsAt ? new Date(startsAt) : null;
  const eRaw = endsAt ? new Date(endsAt) : null;
  const e =
    s && eRaw && Number.isFinite(eRaw.getTime())
      ? eRaw
      : s && Number.isFinite(s.getTime())
        ? s
        : null;

  if (!s || !Number.isFinite(s.getTime())) {
    return {
      datePrimary: '',
      dateSecondary: '',
      timePrimary: '',
      timeSecondary: '',
      daySpan: 1,
      venuePrimary: isOnline ? 'Online' : venueLine || 'Venue TBA',
      venueSecondary: '',
      orgName: organizerName?.trim() || 'Organizer',
    };
  }

  const daySpan = e ? Math.max(1, Math.round((utcDay(e) - utcDay(s)) / 86400000) + 1) : 1;
  const sameCalDay = e ? utcDay(s) === utcDay(e) : true;

  let datePrimary: string;
  if (!e || sameCalDay) {
    datePrimary = s.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } else if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    const monthYear = s.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    datePrimary = `${s.getDate()} – ${e.getDate()} ${monthYear}`;
  } else {
    const o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    datePrimary = `${s.toLocaleDateString('en-US', o)} – ${e.toLocaleDateString('en-US', o)}`;
  }

  const dateSecondary =
    daySpan > 1 ? `${daySpan} days` : s.toLocaleDateString('en-US', { weekday: 'long' });

  const st = formatTimeLabel(startsAt);
  const et = formatTimeLabel(endsAt ?? undefined);
  const timePrimary = st && et && st !== et ? `${st} – ${et}` : st || et || '';
  const timeSecondary = daySpan > 1 ? 'Daily' : '';

  return {
    datePrimary,
    dateSecondary,
    timePrimary,
    timeSecondary,
    daySpan,
    venuePrimary: isOnline ? 'Online' : venueLine || 'Venue TBA',
    venueSecondary: '',
    orgName: organizerName?.trim() || 'Organizer',
  };
}

function toDisplayTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return trimmed;
  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= 4 && letters === letters.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .split(/\s+/)
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(' ');
  }
  return trimmed;
}

function shouldHideFeedStatusChip(
  chip: { label: string; variant: string } | undefined,
  homeTab?: string,
  eventState?: EventCardModel['eventState'],
): boolean {
  if (!chip) return true;
  const label = chip.label.toLowerCase();
  if (homeTab === 'Past' && (label === 'ended' || chip.variant === 'ended')) {
    return true;
  }
  if (
    eventState === 'fully-booked' &&
    (chip.variant === 'sold-out' || label.includes('fully booked'))
  ) {
    return true;
  }
  if (homeTab !== 'Upcoming') return false;
  return chip.variant === 'neutral' || label === 'upcoming';
}

type PressableCardProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

function PressableCard({ onPress, style, children }: PressableCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const onPressIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 120, useNativeDriver: true }),
      Animated.timing(shadowAnim, { toValue: 1, duration: 120, useNativeDriver: false }),
    ]).start();
  }, [scaleAnim, shadowAnim]);

  const onPressOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(shadowAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [scaleAnim, shadowAnim]);

  const dynamicShadow = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 12],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
          shadowRadius: Platform.OS === 'ios' ? dynamicShadow : undefined,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export type EventCardVariant = 'card' | 'feed';

type EventCardProps = {
  event: EventCardModel;
  style?: ViewStyle;
  /** `feed` = flat Meetup-style row on Home (no outer card chrome). */
  variant?: EventCardVariant;
  homeTab?: 'Upcoming' | 'Past' | 'Going' | 'Saved';
};

export function EventCard({ event, style, variant = 'card', homeTab }: EventCardProps) {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { isLoggedIn } = useAuth();
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();

  if (!event) return null;

  const isFeed = variant === 'feed';
  const isSaved = savedEventIds.includes(event.id);
  const kind = parseEventKind(event);
  const goingCountN = typeof event.goingCount === 'number' ? event.goingCount : 0;
  const goingLabel = `${goingCountN} going`;

  const previews = event.attendeePreviews?.filter(Boolean) ?? [];
  const showPreviews = previews.length > 0;
  const showAnonymousGoing = !showPreviews && goingCountN > 0;
  const anonymousFaceCount = Math.min(3, Math.max(1, goingCountN));

  const statusChip = event.statusChip;
  const statusStyle = statusChip ? STATUS_VARIANT_STYLES[statusChip.variant] ?? STATUS_VARIANT_STYLES.neutral : null;
  const urgencyLabel = event.urgencyLabel;
  const categoryName = event.categoryName;
  const showCategoryTag = Boolean(categoryName);
  const formatLabel = formatKeyToDisplayLabel(event.eventFormat);
  const showFormatTag = Boolean(formatLabel);
  const isEnded = event.eventState === 'ended';
  const isClosed = event.eventState === 'closed';
  const isSoldOut = event.eventState === 'fully-booked';
  const bannerOverlayKind = isEnded ? 'ended' : isClosed ? 'closed' : isSoldOut ? 'fully-booked' : null;
  const showBannerOverlay = bannerOverlayKind !== null;
  const bannerOverlaySource = bannerOverlayKind ? BANNER_OVERLAY_IMAGES[bannerOverlayKind] : null;
  const liveStatusLine = event.statusLine ?? null;
  const stateLabel = isClosed || isSoldOut ? event.registrationLabel ?? null : null;
  const seatsLeft =
    typeof event.capacity === 'number' && event.capacity > 0
      ? Math.max(0, event.capacity - goingCountN)
      : null;
  const legacyPriceRaw = (event as { price?: unknown }).price;
  const legacyPrice =
    typeof legacyPriceRaw === 'number' && Number.isFinite(legacyPriceRaw) ? legacyPriceRaw : 0;
  const priceAmountNum =
    typeof event.priceAmount === 'number' && Number.isFinite(event.priceAmount)
      ? event.priceAmount
      : legacyPrice;
  const priceTypeLc = String(event.priceType || '').toLowerCase();
  /** Match list API + mapApiEventToCard: paid if explicit type or positive amount. */
  const treatsAsPaid = priceTypeLc === 'paid' || priceAmountNum > 0;
  const isFreeEvent = !treatsAsPaid;
  const priceLabel = treatsAsPaid ? (priceAmountNum > 0 ? `$${priceAmountNum}` : 'Paid') : 'Free';
  const locationLabel =
    (typeof event.locationName === 'string' && event.locationName.trim()) ||
    parseLocationFromDetails(event.details);
  const metaGrid = useMemo(
    () =>
      buildCardMetaGrid(
        event.startsAt,
        event.endsAt ?? null,
        locationLabel,
        event.organizerName ?? '',
        kind === 'online',
      ),
    [event.startsAt, event.endsAt, locationLabel, event.organizerName, kind],
  );
  const displayTitle = useMemo(() => toDisplayTitle(event.title), [event.title]);
  const showImageStatusChip =
    Boolean(statusStyle && statusChip) &&
    !(isFeed && shouldHideFeedStatusChip(statusChip, homeTab, event.eventState));
  const avatarBorderColor = isFeed ? '#FFFFFF' : colors.card;
  const showFeedCountdown =
    isFeed &&
    Boolean(urgencyLabel) &&
    event.eventState !== 'live' &&
    event.eventState !== 'ended';
  const showFeedDeliveryChip = isFeed;
  const showFeedKindRow =
    isFeed &&
    ((showCategoryTag && categoryName) ||
      showFormatTag ||
      showFeedDeliveryChip ||
      showFeedCountdown);
  const showFeedCapacityBar =
    isFeed && typeof event.capacity === 'number' && event.capacity > 0;
  const discoverySignals = Array.isArray(event.discoverySignals) ? event.discoverySignals : [];
  const visibleDiscoverySignals = urgencyLabel
    ? discoverySignals.filter((chip) => chip.key === 'trending').slice(0, 1)
    : discoverySignals.slice(0, 1);
  const ctaLabel = isEnded
    ? 'Event Ended'
    : isClosed
      ? 'Registration Closed'
      : isSoldOut || event.canWaitlist
        ? 'Join Waitlist'
        : 'View event details';
  const ctaDisabled = isEnded || isClosed;

  const [likeState, setLikeState] = useState({
    isLiked: Boolean(event.isLiked),
    count: Math.max(0, Number(event.likeCount ?? 0) || 0),
  });
  const likeBusy = useRef(false);

  useEffect(() => {
    setLikeState({
      isLiked: Boolean(event.isLiked),
      count: Math.max(0, Number(event.likeCount ?? 0) || 0),
    });
  }, [event.id, event.isLiked, event.likeCount]);

  const handleBookmarkToggle = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }

    if (isSaved) {
      unsaveEvent(event.id);
    } else {
      saveEvent(event.id);
    }
  };

  const handlePress = () => router.push(`/events/${event.id}`);

  const handleLikePress = async () => {
    if (likeBusy.current) return;
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }
    likeBusy.current = true;
    try {
      if (likeState.isLiked) {
        const data = await unlikeEvent(event.id);
        setLikeState({
          isLiked: false,
          count:
            typeof data?.likeCount === 'number'
              ? data.likeCount
              : Math.max(0, likeState.count - 1),
        });
      } else {
        const data = await likeEvent(event.id);
        setLikeState({
          isLiked: true,
          count:
            typeof data?.likeCount === 'number' ? data.likeCount : likeState.count + 1,
        });
      }
    } catch {
      // Keep current state on error.
    } finally {
      likeBusy.current = false;
    }
  };

  return (
    <PressableCard
      onPress={handlePress}
      style={[
        isFeed ? styles.cardFeed : styles.card,
        !isFeed && { backgroundColor: colors.card },
        style,
      ]}
    >
      <View style={isFeed ? styles.heroSectionFeed : styles.heroSection}>
        <View style={styles.heroFrame}>
          {event.coverImageUrl ? (
            <>
              <Image
                source={{ uri: event.coverImageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
                blurRadius={showBannerOverlay ? BANNER_STATUS_BLUR_RADIUS : 0}
              />
              {!showBannerOverlay ? (
                <LinearGradient
                  colors={['transparent', 'rgba(15, 23, 42, 0.22)']}
                  style={styles.heroScrim}
                  pointerEvents="none"
                />
              ) : null}
              {showBannerOverlay && bannerOverlaySource ? (
                <>
                  <View style={[styles.imageBgOverlay, styles.imageTerminalOverlay]} />
                  <View style={styles.terminalBadgeWrap}>
                    <Image source={bannerOverlaySource} style={styles.terminalBadge} resizeMode="contain" />
                  </View>
                </>
              ) : null}
            </>
          ) : (
            <CoverPlaceholder
              letter={event.coverLetter ?? event.title}
              gradient={(event.coverGradient ?? DEFAULT_COVER_GRADIENT) as readonly [string, string]}
              borderRadius={HERO_RADIUS}
              style={styles.heroPlaceholder}
            />
          )}

          {isFeed && showImageStatusChip && statusChip && statusStyle ? (
            <View style={styles.feedBannerChipsWrap}>
              <Chip label={statusChip.label} bg={statusStyle.bg} fg={statusStyle.fg} icon={statusStyle.icon} />
            </View>
          ) : !isFeed && showImageStatusChip && statusChip && statusStyle ? (
            <View style={styles.statusChipWrap}>
              <Chip label={statusChip.label} bg={statusStyle.bg} fg={statusStyle.fg} icon={statusStyle.icon} />
            </View>
          ) : null}

          <View style={styles.imageActions}>
            <TouchableOpacity
              style={[styles.iconBtn, isFeed ? styles.iconBtnFeed : styles.iconBtnShadow]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                Share.share({ message: event.title }).catch(() => undefined);
              }}
              accessibilityRole="button"
              accessibilityLabel="Share event"
            >
              <Feather name="share-2" size={17} color={isFeed ? '#FFFFFF' : OVERLAY_ACTION_ICON} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconBtn,
                isFeed ? (isSaved ? styles.iconBtnFeedSaved : styles.iconBtnFeed) : styles.iconBtnShadow,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleBookmarkToggle}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Remove bookmark' : 'Save event'}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={17}
                color={isFeed ? '#FFFFFF' : isSaved ? colors.primary : OVERLAY_ACTION_ICON}
              />
            </TouchableOpacity>
          </View>
          {isFeed && !showBannerOverlay ? (
            <View
              style={styles.feedBannerPriceWrap}
              pointerEvents="none"
              accessibilityLabel={isFreeEvent ? 'Free event' : `Paid event, ${priceLabel}`}
            >
              <EventPriceBadge isFree={isFreeEvent} label={priceLabel} variant="banner" />
            </View>
          ) : null}
          {urgencyLabel && !showBannerOverlay && !isFeed ? (
            <View style={styles.imageUrgencyWrap}>
              <View style={[styles.urgencyChip, styles.imageUrgencyChip, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="alarm-outline" size={11} color={colors.primary} />
                <Text style={[styles.urgencyText, { color: colors.primary }]}>{urgencyLabel}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        {isFeed ? (
          <>
            {showFeedKindRow ? (
              <EventFeedKindChipsRow
                categoryName={categoryName}
                formatLabel={formatLabel}
                isOnline={kind === 'online'}
                urgencyLabel={urgencyLabel}
                showCategory={showCategoryTag}
                showFormat={showFormatTag}
                showDelivery={showFeedDeliveryChip}
                showCountdown={showFeedCountdown}
              />
            ) : null}
            <View style={styles.titleRow}>
              <Text style={[styles.title, styles.feedTitle, { color: colors.text }]} numberOfLines={2}>
                {displayTitle}
              </Text>
            </View>
            <View style={styles.feedMetaCompact}>
              {metaGrid.datePrimary || metaGrid.timePrimary ? (
                <View style={styles.feedMetaLineRow}>
                  {metaGrid.datePrimary ? (
                    <View style={styles.feedMetaSegment}>
                      <Ionicons name="calendar-outline" size={14} color="#FF7A00" />
                      <Text
                        style={[styles.feedMetaIconText, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {metaGrid.datePrimary}
                      </Text>
                    </View>
                  ) : null}
                  {metaGrid.datePrimary && metaGrid.timePrimary ? (
                    <Text style={[styles.feedMetaDot, { color: colors.textSecondary }]}>·</Text>
                  ) : null}
                  {metaGrid.timePrimary ? (
                    <View style={styles.feedMetaSegment}>
                      <Ionicons name="time-outline" size={14} color="#FF7A00" />
                      <Text
                        style={[styles.feedMetaIconText, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {metaGrid.timePrimary}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {metaGrid.venuePrimary ? (
                <View style={styles.feedMetaLineRow}>
                  <View style={[styles.feedMetaSegment, styles.feedMetaSegmentFlex]}>
                    <Ionicons name="location-outline" size={14} color="#FF7A00" />
                    <Text
                      style={[styles.feedMetaIconText, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {metaGrid.venuePrimary}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
            <View style={styles.feedFooterRow}>
              <View style={styles.feedGoingWrap}>
                <View style={styles.avatarStack}>
                  {showPreviews ? (
                    previews.map((p, idx) => (
                      <MemberInitialAvatar
                        key={p.userId != null ? String(p.userId) : `${p.name}-${idx}`}
                        name={p.name}
                        size={32}
                        borderColor={avatarBorderColor}
                        style={idx > 0 ? styles.feedAvatarOverlap : undefined}
                      />
                    ))
                  ) : showAnonymousGoing ? (
                    Array.from({ length: Math.min(3, anonymousFaceCount) }, (_, idx) => (
                      <MemberInitialAvatar
                        key={`anon-${idx}`}
                        name={`Attendee ${idx + 1}`}
                        size={32}
                        borderColor={avatarBorderColor}
                        style={idx > 0 ? styles.feedAvatarOverlap : undefined}
                      />
                    ))
                  ) : (
                    <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
                  )}
                </View>
                <Text style={[styles.feedGoingText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {goingLabel}
                </Text>
              </View>
            </View>
            {showFeedCapacityBar ? (
              <EventCapacityBar
                goingCount={goingCountN}
                capacity={event.capacity}
                eventState={event.eventState}
              />
            ) : null}
          </>
        ) : (
          <>
        <View style={styles.tagRow}>
          {showCategoryTag && categoryName ? (
            <View style={[styles.tag, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="pricetag-outline" size={11} color="#EA580C" />
              <Text style={[styles.tagLabel, { color: '#EA580C' }]}>{categoryName}</Text>
            </View>
          ) : null}
          <View style={[styles.tag, { backgroundColor: kind === 'online' ? colors.tagOnlineBg : colors.tagPhysicalBg }]}>
            <Ionicons
              name={kind === 'online' ? 'videocam-outline' : 'location-outline'}
              size={13}
              color={kind === 'online' ? colors.tagOnlineFg : colors.tagPhysicalFg}
            />
            <Text style={[styles.tagLabel, { color: kind === 'online' ? colors.tagOnlineFg : colors.tagPhysicalFg }]}>
              {kind === 'online' ? 'Online' : 'In person'}
            </Text>
          </View>
          {showFormatTag ? (
            <View style={[styles.tag, styles.brandMetaTag]}>
              <Ionicons name="albums-outline" size={11} color={BRAND_TAG_FG} />
              <Text style={[styles.tagLabel, styles.brandMetaTagText]}>{formatLabel}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
        {event.description ? (
          <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={1}>
            {event.description}
          </Text>
        ) : null}
        {liveStatusLine ? (
          <View style={styles.liveStatusPill}>
            <Ionicons name="time-outline" size={12} color="#B45309" />
            <Text style={styles.liveStatusText}>{liveStatusLine}</Text>
          </View>
        ) : null}

        <View style={styles.compactMetaGrid}>
          <View style={styles.compactMetaRow}>
            <View style={styles.compactTile}>
              <View style={styles.compactTileHeader}>
                <Ionicons name="calendar-outline" size={14} color="#FF7A00" />
                <Text style={styles.compactTileLabel}>Date</Text>
              </View>
              {metaGrid.datePrimary ? (
                <Text style={styles.compactTilePrimary} numberOfLines={1}>
                  {metaGrid.datePrimary}
                </Text>
              ) : null}
              {metaGrid.dateSecondary ? (
                <Text
                  style={metaGrid.daySpan > 1 ? styles.compactTileAccent : styles.compactTileSecondary}
                  numberOfLines={1}
                >
                  {metaGrid.dateSecondary}
                </Text>
              ) : null}
            </View>
            <View style={styles.compactTile}>
              <View style={styles.compactTileHeader}>
                <Ionicons name="time-outline" size={14} color="#FF7A00" />
                <Text style={styles.compactTileLabel}>Time</Text>
              </View>
              {metaGrid.timePrimary ? (
                <Text style={styles.compactTilePrimary} numberOfLines={1}>
                  {metaGrid.timePrimary}
                </Text>
              ) : null}
              {metaGrid.timeSecondary ? (
                <Text style={styles.compactTileAccent} numberOfLines={1}>
                  {metaGrid.timeSecondary}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.compactMetaRow}>
            <View style={styles.compactTile}>
              <View style={styles.compactTileHeader}>
                <Ionicons name="location-outline" size={14} color="#FF7A00" />
                <Text style={styles.compactTileLabel}>Venue</Text>
              </View>
              <Text style={styles.compactTilePrimary} numberOfLines={1}>
                {metaGrid.venuePrimary}
              </Text>
              {metaGrid.venueSecondary ? (
                <Text style={styles.compactTileSecondary} numberOfLines={1}>
                  {metaGrid.venueSecondary}
                </Text>
              ) : null}
            </View>
            <View style={styles.compactTile}>
              <View style={styles.compactTileHeader}>
                <Ionicons name="business-outline" size={14} color="#FF7A00" />
                <Text style={styles.compactTileLabel}>Organized by</Text>
              </View>
              <View style={styles.compactOrgRow}>
                <Text style={styles.compactTilePrimary} numberOfLines={1}>
                  {metaGrid.orgName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.socialRow}>
          <View style={styles.socialLeft}>
            <View style={styles.avatarStack}>
              {showPreviews ? (
                previews.map((p, idx) => (
                  <MemberInitialAvatar
                    key={p.userId != null ? String(p.userId) : `${p.name}-${idx}`}
                    name={p.name}
                    size={36}
                    borderColor={colors.card}
                    style={idx > 0 ? styles.avatarOverlap : undefined}
                  />
                ))
              ) : showAnonymousGoing ? (
                Array.from({ length: anonymousFaceCount }, (_, idx) => (
                  <MemberInitialAvatar
                    key={`anon-${idx}`}
                    name={`Attendee ${idx + 1}`}
                    size={36}
                    borderColor={colors.card}
                    style={idx > 0 ? styles.avatarOverlap : undefined}
                  />
                ))
              ) : (
                <Ionicons name="people-outline" size={22} color={colors.textSecondary} />
              )}
            </View>
            <Text
              style={[styles.goingText, { color: colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {goingLabel}
            </Text>
          </View>
          <View style={styles.socialRight}>
            {visibleDiscoverySignals.length > 0 ? (
              <View style={styles.discoverySignalsWrap}>
                {visibleDiscoverySignals.map((chip) => (
                  <View
                    key={chip.key || chip.label}
                    style={[
                      styles.compactStateChip,
                      chip.tone === 'hot' ? styles.hotChip : styles.soonChip,
                    ]}
                  >
                    {chip.key === 'trending' ? (
                      <Ionicons
                        name="flame"
                        size={11}
                        color={chip.tone === 'hot' ? '#BE123C' : '#1D4ED8'}
                      />
                    ) : chip.key === 'starting-soon' ? (
                      <Ionicons
                        name="time"
                        size={11}
                        color={chip.tone === 'hot' ? '#BE123C' : '#1D4ED8'}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.compactStateText,
                        chip.tone === 'hot' ? styles.hotChipText : styles.soonChipText,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : !showBannerOverlay ? (
              <EventPriceBadge isFree={isFreeEvent} label={priceLabel} variant="inline" />
            ) : stateLabel ? (
              <Text
                style={[
                  styles.capacityState,
                  { color: isSoldOut ? '#DC2626' : '#9CA3AF' },
                  isClosed ? { color: '#B91C1C', backgroundColor: '#FEF2F2' } : null,
                  isEnded ? { color: '#6B7280', backgroundColor: '#F3F4F6' } : null,
                ]}
              >
                {stateLabel}
              </Text>
            ) : null}
          </View>
        </View>

        {typeof seatsLeft === 'number' && !isSoldOut && !isEnded ? (
          <View style={styles.seatsRow}>
            <View style={styles.seatsLeftWrap}>
              <Ionicons name="ticket-outline" size={12} color="#0EA5E9" />
              <Text style={styles.seatsLeftText}>{seatsLeft} seats left</Text>
            </View>
          </View>
        ) : null}

        {!isFeed ? (
          <View style={styles.ctaRow}>
            <View style={styles.ctaRowInner}>
              <TouchableOpacity
                activeOpacity={ctaDisabled ? 1 : 0.9}
                style={[styles.ctaButton, styles.ctaButtonFlex]}
                onPress={handlePress}
                disabled={ctaDisabled}
              >
                {ctaDisabled ? (
                  <View style={[styles.ctaButtonFill, isEnded ? styles.ctaEnded : styles.ctaClosed]}>
                    <Text style={[styles.ctaText, isEnded ? styles.ctaEndedText : styles.ctaClosedText]}>
                      {ctaLabel}
                    </Text>
                  </View>
                ) : isSoldOut || event.canWaitlist ? (
                  <View style={[styles.ctaButtonFill, styles.ctaWaitlist]}>
                    <Ionicons name="hourglass-outline" size={14} color="#C2410C" />
                    <Text style={[styles.ctaText, styles.ctaWaitlistText]}>{ctaLabel}</Text>
                  </View>
                ) : (
                  <View style={[styles.ctaButtonFill, styles.ctaOutline]}>
                    <Text style={styles.ctaOutlineText}>{ctaLabel}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardLikeBtn}
                onPress={handleLikePress}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={likeState.isLiked ? 'Unlike event' : 'Like event'}
              >
                <Ionicons
                  name={likeState.isLiked ? 'heart' : 'heart-outline'}
                  size={20}
                  color="#FF7A00"
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
          </>
        )}
      </View>
    </PressableCard>
  );
}

/** Meetup-style inset hero: scales with card width, keeps posters readable. */
const HERO_RADIUS = 14;
const HERO_ASPECT_RATIO = 2;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  cardFeed: {
    marginHorizontal: spacing.md,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  heroSection: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  heroSectionFeed: {
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  heroFrame: {
    width: '100%',
    aspectRatio: HERO_ASPECT_RATIO,
    borderRadius: HERO_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  imageBgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  imageTerminalOverlay: {
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  terminalBadgeWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  terminalBadge: {
    width: '74%',
    height: '62%',
  },
  statusChipWrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  feedBannerChipsWrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    alignItems: 'flex-start',
    gap: 6,
  },
  feedBannerKindChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 3,
  },
  chipIcon: {
    marginRight: 1,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  imageActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  imageUrgencyWrap: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    zIndex: 10,
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnFeed: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 18,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  iconBtnFeedSaved: {
    backgroundColor: '#FF7A00',
    borderRadius: 18,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  feedUrgencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 3,
    flexShrink: 0,
  },
  feedUrgencyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  feedBannerPriceWrap: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },
  priceBadgePillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  priceBadgePillInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  priceBadgeIconBanner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  priceBadgeIconInline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  priceBadgeTextBanner: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.25,
  },
  priceBadgeTextInline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  iconBtnShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  body: {
    paddingHorizontal: spacing.sm,
    paddingTop: 10,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  feedKindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  feedKindTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  feedKindTagLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
  feedTitle: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
  },
  feedMetaCompact: {
    marginTop: 2,
    gap: 6,
  },
  feedMetaLineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  feedMetaSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  feedMetaSegmentFlex: {
    flex: 1,
    minWidth: 0,
  },
  feedMetaDot: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.45,
  },
  feedMetaIconText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    flexShrink: 1,
  },
  feedFooterRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedGoingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  feedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  feedAvatarOverlap: {
    marginLeft: -11,
  },
  feedInitialLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  feedGoingText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  urgencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 3,
    flexShrink: 0,
  },
  imageUrgencyChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  tagRow: {
    marginTop: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  summary: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  compactMetaGrid: {
    marginTop: 8,
    gap: 6,
  },
  compactMetaRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'stretch',
  },
  compactTile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 52,
  },
  compactTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  compactTileLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  compactTilePrimary: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 15,
  },
  compactTileSecondary: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 13,
  },
  compactTileAccent: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF7A00',
    marginTop: 2,
    lineHeight: 13,
  },
  compactOrgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveStatusPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  brandMetaTag: {
    backgroundColor: BRAND_TAG_BG,
  },
  brandMetaTagText: {
    color: BRAND_TAG_FG,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    minHeight: 36,
  },
  socialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flex: 1,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  goingText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: '700',
  },
  compactStateChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 108,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  hotChip: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  soonChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  socialRight: {
    marginLeft: spacing.sm,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  discoverySignalsWrap: {
    alignItems: 'flex-end',
    gap: 6,
  },
  compactStateText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hotChipText: {
    color: '#BE123C',
  },
  soonChipText: {
    color: '#1D4ED8',
  },
  seatsRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seatsLeftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0C4A6E',
    letterSpacing: 0.2,
  },
  capacityState: {
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  ctaRow: {
    marginTop: 8,
  },
  ctaRowInner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  ctaButton: {
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaButtonFlex: {
    flex: 1,
    minWidth: 0,
  },
  cardLikeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD7BC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderRadius: 12,
  },
  ctaOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ctaOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaWaitlist: {
    backgroundColor: '#FFF1E6',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  ctaWaitlistText: {
    color: '#C2410C',
  },
  ctaEnded: {
    backgroundColor: '#F3F4F6',
  },
  ctaEndedText: {
    color: '#6B7280',
  },
  ctaClosed: {
    backgroundColor: '#FEE2E2',
  },
  ctaClosedText: {
    color: '#B91C1C',
  },
});
