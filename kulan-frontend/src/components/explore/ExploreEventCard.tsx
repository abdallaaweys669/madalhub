import React, { useCallback, useEffect, useRef, type ComponentProps } from 'react';
import {
  Animated,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';
import { trackEventInteraction } from '@/api/trackEventInteraction';

const ORANGE = '#FF7B3F';
const COVER_RADIUS = 16;

const CHIP_CATEGORY = {
  bg: '#F1F5F9',
  border: '#CBD5E1',
  text: '#334155',
  icon: '#64748B',
  iconBg: '#E2E8F0',
};

const CHIP_FORMAT = {
  bg: '#EEF2FF',
  border: '#C7D2FE',
  text: '#4338CA',
  icon: '#6366F1',
  iconBg: '#E0E7FF',
};

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const CHIP_MODE: Record<
  'online' | 'in-person',
  {
    bg: string;
    border: string;
    text: string;
    icon: string;
    iconBg: string;
    label: string;
    iconName: IoniconName;
  }
> = {
  online: {
    bg: '#ECFEFF',
    border: '#A5F3FC',
    text: '#0E7490',
    icon: '#0891B2',
    iconBg: '#CFFAFE',
    label: 'Online',
    iconName: 'globe-outline',
  },
  'in-person': {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    text: '#15803D',
    icon: '#16A34A',
    iconBg: '#DCFCE7',
    label: 'In-person',
    iconName: 'business-outline',
  },
};

export type ExploreEventChip = {
  label: string;
  type: 'category' | 'format' | 'mode';
  variant?: string;
};

const FORMAT_CHIP_ICONS: Record<string, IoniconName> = {
  meetup: 'cafe-outline',
  panel: 'people-outline',
  seminar: 'school-outline',
  workshop: 'construct-outline',
  talk: 'mic-outline',
  bootcamp: 'barbell-outline',
};

function EventMetaChip({ chip }: { chip: ExploreEventChip }) {
  if (chip.type === 'mode') {
    const modeKey = chip.variant === 'online' ? 'online' : 'in-person';
    const palette = CHIP_MODE[modeKey];
    return (
      <View style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }]}>
        <View style={[styles.chipIconWrap, { backgroundColor: palette.iconBg }]}>
          <Ionicons name={palette.iconName} size={11} color={palette.icon} />
        </View>
        <Text style={[styles.chipText, { color: palette.text }]}>{chip.label}</Text>
      </View>
    );
  }

  const isCategory = chip.type === 'category';
  const icon: IoniconName = isCategory
    ? 'pricetag-outline'
    : FORMAT_CHIP_ICONS[chip.variant ?? chip.label.toLowerCase()] ?? 'albums-outline';

  return (
    <View style={[styles.chip, isCategory ? styles.chipCategory : styles.chipFormat]}>
      <View style={[styles.chipIconWrap, isCategory ? styles.chipIconCategory : styles.chipIconFormat]}>
        <Ionicons
          name={icon}
          size={11}
          color={isCategory ? CHIP_CATEGORY.icon : CHIP_FORMAT.icon}
        />
      </View>
      <Text style={[styles.chipText, isCategory ? styles.chipTextCategory : styles.chipTextFormat]}>
        {chip.label}
      </Text>
    </View>
  );
}

function resolveEventChips(event: ExploreEventCardModel): ExploreEventChip[] {
  const base =
    event.eventChips?.length
      ? event.eventChips
      : event.categoryTags?.length
        ? event.categoryTags.map((label, index) => ({
            label,
            type: index === 0 ? ('category' as const) : ('format' as const),
          }))
        : event.categoryName
          ? [{ label: event.categoryName, type: 'category' as const }]
          : [];

  if (base.some((chip) => chip.type === 'mode')) return base;

  const modeKey = event.mode === 'online' ? 'online' : 'in-person';
  const modePalette = CHIP_MODE[modeKey];
  return [
    ...base,
    { label: modePalette.label, type: 'mode', variant: modeKey },
  ];
}

export type ExploreEventCardModel = {
  id: string;
  title: string;
  dateTimeLabel: string;
  dateLabel?: string;
  timeLabel?: string;
  location: string;
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
};

type ExploreEventCardProps = {
  event: ExploreEventCardModel;
};

export function ExploreEventCard({ event }: ExploreEventCardProps) {
  const router = useGuardedRouter();
  const { isLoggedIn } = useAuth();
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();
  const isSaved = savedEventIds.includes(event.id);

  const toggleSave = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }
    if (isSaved) unsaveEvent(event.id);
    else saveEvent(event.id);
  };

  const openDetail = () => {
    if (isLoggedIn) trackEventInteraction(event.id, 'opened');
    router.push(`/events/${event.id}`);
  };

  const shareEvent = async () => {
    if (isLoggedIn) trackEventInteraction(event.id, 'shared');
    try {
      await Share.share({
        message: `${event.title}\n${event.dateTimeLabel}`,
      });
    } catch {
      /* user dismissed share sheet */
    }
  };

  const previews = event.attendeePreviews?.filter(Boolean) ?? [];
  const showPreviews = previews.length > 0;
  const goingCountN = typeof event.goingCount === 'number' ? event.goingCount : 0;
  const showAnonymousGoing = !showPreviews && goingCountN > 0;
  const anonymousFaceCount = Math.min(3, Math.max(1, goingCountN));

  const statusLabel = event.urgencyLabel || event.statusChip?.label;
  const dateLabel = event.dateLabel || event.dateTimeLabel.split('•')[0]?.trim();
  const timeLabel = event.timeLabel || event.dateTimeLabel.split('•')[1]?.trim();
  const priceLabel = event.priceLabel || 'Free';
  const eventChips = resolveEventChips(event);

  useEffect(() => {
    if (isLoggedIn) trackEventInteraction(event.id, 'viewed');
  }, [event.id, isLoggedIn]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(() => {
    Animated.timing(scaleAnim, { toValue: 0.985, duration: 100, useNativeDriver: true }).start();
  }, [scaleAnim]);
  const onPressOut = useCallback(() => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.item, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={openDetail}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <View style={styles.coverBlock}>
          {event.coverImageUrl ? (
            <Image source={{ uri: event.coverImageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <CoverPlaceholder
              letter={event.coverLetter ?? event.title}
              gradient={(event.coverGradient ?? DEFAULT_COVER_GRADIENT) as readonly [string, string]}
              borderRadius={COVER_RADIUS}
              style={styles.coverImage}
              letterSize={48}
            />
          )}

          <View style={styles.heroOverlayTop}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>{priceLabel}</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.heroActionBtn, styles.heroActionBtnGlass]}
                activeOpacity={0.85}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => void shareEvent()}
                accessibilityRole="button"
                accessibilityLabel="Share event"
              >
                <Feather name="share-2" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.heroActionBtn,
                  isSaved ? styles.heroActionBtnSaved : styles.heroActionBtnGlass,
                ]}
                activeOpacity={0.85}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={toggleSave}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Remove bookmark' : 'Bookmark event'}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {statusLabel ? (
            <View style={styles.statusBadge}>
              <Ionicons name="timer-outline" size={13} color="#FFFFFF" />
              <Text style={styles.statusBadgeText}>{statusLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          {eventChips.length ? (
            <View style={styles.chipRow}>
              {eventChips.map((chip) => (
                <EventMetaChip key={`${chip.type}-${chip.label}`} chip={chip} />
              ))}
            </View>
          ) : null}

          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          {dateLabel || timeLabel ? (
            <View style={styles.dateTimeRow}>
              {dateLabel ? (
                <View style={styles.dateTimePart}>
                  <Ionicons name="calendar-outline" size={16} color={ORANGE} />
                  <Text style={styles.metaTextMuted} numberOfLines={1}>
                    {dateLabel}
                  </Text>
                </View>
              ) : null}
              {timeLabel ? (
                <View style={styles.dateTimePart}>
                  <Ionicons name="time-outline" size={16} color={ORANGE} />
                  <Text style={styles.metaTextMuted} numberOfLines={1}>
                    {timeLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={ORANGE} />
            <Text style={styles.metaTextMuted} numberOfLines={2}>
              {event.location}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.avatarStack}>
              {showPreviews ? (
                previews.slice(0, 3).map((p, idx) => (
                  <MemberInitialAvatar
                    key={p.userId != null ? String(p.userId) : `${p.name}-${idx}`}
                    name={p.name}
                    size={30}
                    borderWidth={2}
                    style={idx > 0 ? styles.avatarOverlap : undefined}
                  />
                ))
              ) : showAnonymousGoing ? (
                Array.from({ length: anonymousFaceCount }, (_, idx) => (
                  <MemberInitialAvatar
                    key={`anon-${idx}`}
                    name={`Attendee ${idx + 1}`}
                    size={30}
                    borderWidth={2}
                    style={idx > 0 ? styles.avatarOverlap : undefined}
                  />
                ))
              ) : (
                <Ionicons name="people-outline" size={18} color="#B0B4BC" />
              )}
            </View>
            <Text style={styles.goingText}>{event.goingLabel}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    marginBottom: 20,
  },
  pressed: {
    opacity: 0.96,
  },
  coverBlock: {
    width: '100%',
    height: 200,
    borderRadius: COVER_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#E8EAED',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayTop: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  priceBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: ORANGE,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionBtnGlass: {
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  heroActionBtnSaved: {
    backgroundColor: ORANGE,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ORANGE,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    paddingTop: 10,
    paddingBottom: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingRight: 11,
    paddingLeft: 4,
    paddingVertical: 4,
    borderWidth: 1,
  },
  chipCategory: {
    backgroundColor: CHIP_CATEGORY.bg,
    borderColor: CHIP_CATEGORY.border,
  },
  chipFormat: {
    backgroundColor: CHIP_FORMAT.bg,
    borderColor: CHIP_FORMAT.border,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chipIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIconCategory: {
    backgroundColor: CHIP_CATEGORY.iconBg,
  },
  chipIconFormat: {
    backgroundColor: CHIP_FORMAT.iconBg,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  chipTextCategory: {
    color: CHIP_CATEGORY.text,
  },
  chipTextFormat: {
    color: CHIP_FORMAT.text,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.3,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 5,
  },
  dateTimePart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  metaTextMuted: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#8E929B',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  goingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A1A1AA',
  },
});
