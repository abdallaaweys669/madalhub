import React, { useCallback, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import useAuth from '@/auth/useAuth';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { spacing, useThemeColors } from '@/theme';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';

const OVERLAY_ACTION_ICON = '#3F3F46';

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
};

function AttendeeFace({
  avatarUrl,
  name,
  style,
}: {
  avatarUrl: string | null;
  name: string;
  style: StyleProp<ImageStyle | ViewStyle>;
}) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={style as StyleProp<ImageStyle>} />;
  }
  return (
    <View style={[style, { backgroundColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' }]}>
      <Ionicons name="person" size={14} color="#FFFFFF" accessibilityLabel={name} />
    </View>
  );
}

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

function formatDateLabel(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
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

type EventCardProps = {
  event: EventCardModel;
  style?: ViewStyle;
};

export function EventCard({ event, style }: EventCardProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const { isLoggedIn } = useAuth();
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();

  if (!event) return null;

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
  const isEnded = event.eventState === 'ended';
  const isClosed = event.eventState === 'closed';
  const isSoldOut = event.eventState === 'fully-booked';
  const showTerminalOverlay = isEnded || isClosed;
  const terminalBadgeSource = isEnded
    ? require('../../assets/ended.png')
    : require('../../assets/Closed.png');
  const liveStatusLine = event.statusLine ?? null;
  const stateLabel = isClosed || isSoldOut ? event.registrationLabel ?? null : null;
  const seatsLeft =
    typeof event.capacity === 'number' && event.capacity > 0
      ? Math.max(0, event.capacity - goingCountN)
      : null;
  const priceLabel =
    String(event.priceType || '').toLowerCase() === 'paid'
      ? typeof event.priceAmount === 'number' && Number.isFinite(event.priceAmount)
        ? `$${event.priceAmount}`
        : 'Paid'
      : 'Free';
  const startDateLabel = formatDateLabel(event.startsAt);
  const startTimeLabel = formatTimeLabel(event.startsAt);
  const endTimeLabel = formatTimeLabel(event.endsAt);
  const timeRangeLabel =
    startTimeLabel && endTimeLabel ? `${startTimeLabel} - ${endTimeLabel}` : startTimeLabel;
  const locationLabel = parseLocationFromDetails(event.details);
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
        : 'Register Now';
  const ctaDisabled = isEnded || isClosed;

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

  return (
    <PressableCard
      onPress={handlePress}
      style={[styles.card, { backgroundColor: colors.card }, style]}
    >
      <View style={styles.imageWrap}>
        {event.coverImageUrl ? (
          <View style={styles.imageLayerWrap}>
            <Image
              source={{ uri: event.coverImageUrl }}
              style={styles.imageBg}
              resizeMode="cover"
              blurRadius={showTerminalOverlay ? 11 : 0}
            />
            <View style={[styles.imageBgOverlay, showTerminalOverlay && styles.imageTerminalOverlay]} />
            <Image
              source={{ uri: event.coverImageUrl }}
              style={[styles.image, showTerminalOverlay && styles.imageFaded]}
              resizeMode="contain"
              blurRadius={showTerminalOverlay ? 7 : 0}
            />
            {showTerminalOverlay ? (
              <View style={styles.terminalBadgeWrap}>
                <Image source={terminalBadgeSource} style={styles.terminalBadge} resizeMode="contain" />
              </View>
            ) : null}
          </View>
        ) : (
          <CoverPlaceholder
            letter={event.coverLetter ?? event.title}
            gradient={(event.coverGradient ?? DEFAULT_COVER_GRADIENT) as readonly [string, string]}
            borderRadius={CARD_RADIUS}
            style={styles.image}
          />
        )}

        {statusStyle && statusChip && (
          <View style={styles.statusChipWrap}>
            <Chip label={statusChip.label} bg={statusStyle.bg} fg={statusStyle.fg} icon={statusStyle.icon} />
          </View>
        )}

        <View style={styles.imageActions}>
          <TouchableOpacity
            style={[styles.iconBtn, styles.iconBtnShadow]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              Share.share({ message: event.title }).catch(() => undefined);
            }}
            accessibilityRole="button"
            accessibilityLabel="Share event"
          >
            <Feather name="share-2" size={16} color={OVERLAY_ACTION_ICON} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.iconBtnShadow]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={handleBookmarkToggle}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove bookmark' : 'Save event'}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isSaved ? colors.primary : OVERLAY_ACTION_ICON}
            />
          </TouchableOpacity>
        </View>
        {urgencyLabel && !showTerminalOverlay ? (
          <View style={styles.imageUrgencyWrap}>
            <View style={[styles.urgencyChip, styles.imageUrgencyChip, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="alarm-outline" size={11} color={colors.primary} />
              <Text style={[styles.urgencyText, { color: colors.primary }]}>{urgencyLabel}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
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
              {kind === 'online' ? 'ONLINE' : 'IN-PERSON'}
            </Text>
          </View>
          <View style={[styles.tag, priceLabel === 'Free' ? styles.priceFreeTag : styles.pricePaidTag]}>
            <Ionicons
              name={priceLabel === 'Free' ? 'cash-outline' : 'card-outline'}
              size={11}
              color={priceLabel === 'Free' ? '#166534' : '#92400E'}
            />
            <Text style={[styles.tagLabel, { color: priceLabel === 'Free' ? '#166534' : '#92400E' }]}>
              {priceLabel}
            </Text>
          </View>
        </View>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
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

        <View style={styles.metaBlock}>
          {startDateLabel ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {startDateLabel}
              </Text>
            </View>
          ) : null}
          {timeRangeLabel ? (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {timeRangeLabel}
              </Text>
            </View>
          ) : null}
          {locationLabel ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationLabel}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              Organized by {event.organizerName?.trim() ? event.organizerName : 'Organizer'}
            </Text>
          </View>
        </View>

        <View style={styles.socialRow}>
          <View style={styles.socialLeft}>
            <View style={styles.avatarStack}>
              {showPreviews ? (
                previews.map((p, idx) => (
                  <AttendeeFace
                    key={p.userId != null ? String(p.userId) : `${p.name}-${idx}`}
                    avatarUrl={p.avatarUrl}
                    name={p.name}
                    style={[
                      styles.avatar,
                      { borderColor: colors.card },
                      idx > 0 && styles.avatarOverlap,
                    ]}
                  />
                ))
              ) : showAnonymousGoing ? (
                Array.from({ length: anonymousFaceCount }, (_, idx) => (
                  <AttendeeFace
                    key={`anon-${idx}`}
                    avatarUrl={null}
                    name="Attendee"
                    style={[
                      styles.avatar,
                      { borderColor: colors.card },
                      idx > 0 && styles.avatarOverlap,
                    ]}
                  />
                ))
              ) : (
                <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
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
          {visibleDiscoverySignals.length > 0 ? (
            <View style={styles.socialRight}>
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
            </View>
          ) : null}
        </View>

        <View style={styles.capacityRow}>
            {typeof seatsLeft === 'number' && !isSoldOut && !isEnded ? (
              <View style={styles.seatsLeftWrap}>
                <Ionicons name="ticket-outline" size={12} color="#0EA5E9" />
                <Text style={styles.seatsLeftText}>{seatsLeft} seats left</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.capacityRight}>
              {stateLabel ? (
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
        <View style={styles.ctaRow}>
          <TouchableOpacity
            activeOpacity={ctaDisabled ? 1 : 0.9}
            style={styles.ctaButton}
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
              <LinearGradient
                colors={['#FF7A00', '#FF9A3D']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.ctaButtonFill}
              >
                <Text style={styles.ctaText}> {ctaLabel}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </PressableCard>
  );
}

const CARD_RADIUS = 16;
const IMAGE_HEIGHT = 164;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
  imageLayerWrap: {
    width: '100%',
    height: IMAGE_HEIGHT,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  imageBg: {
    ...StyleSheet.absoluteFillObject,
  },
  imageBgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  imageTerminalOverlay: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  imageFaded: {
    opacity: 0.6,
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
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 2,
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
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    zIndex: 2,
  },
  imageUrgencyWrap: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    zIndex: 2,
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 24,
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
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  metaBlock: {
    marginTop: 8,
    gap: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
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
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    minHeight: 32,
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
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
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
  priceFreeTag: {
    backgroundColor: '#ECFDF3',
  },
  pricePaidTag: {
    backgroundColor: '#FFF7ED',
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
  capacityRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capacityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginTop: 12,
  },
  ctaButton: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaButtonFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderRadius: 14,
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
