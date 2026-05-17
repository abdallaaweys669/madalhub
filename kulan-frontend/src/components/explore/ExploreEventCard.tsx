import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';
import { useThemeColors } from '@/theme';

export type ExploreEventCardModel = {
  id: string;
  title: string;
  dateTimeLabel: string;
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
  eventState?: 'upcoming' | 'live' | 'fully-booked' | 'closed' | 'ended';
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
      {icon && <Ionicons name={icon} size={10} color={fg} />}
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

type ExploreEventCardProps = {
  event: ExploreEventCardModel;
};

export function ExploreEventCard({ event }: ExploreEventCardProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();
  const colors = useThemeColors();
  const isSaved = savedEventIds.includes(event.id);

  const toggleSave = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }

    if (isSaved) unsaveEvent(event.id);
    else saveEvent(event.id);
  };

  const openDetail = () => router.push(`/events/${event.id}`);

  const shareEvent = async () => {
    try {
      await Share.share({
        message: `${event.title}\n${event.dateTimeLabel}`,
      });
    } catch {
      /* user dismissed share sheet */
    }
  };

  const isOnline = event.mode === 'online';

  const previews = event.attendeePreviews?.filter(Boolean) ?? [];
  const showPreviews = previews.length > 0;
  const goingCountN = typeof event.goingCount === 'number' ? event.goingCount : 0;
  const showAnonymousGoing = !showPreviews && goingCountN > 0;
  const anonymousFaceCount = Math.min(3, Math.max(1, goingCountN));

  const statusChip = event.statusChip;
  const statusStyle = statusChip ? STATUS_VARIANT_STYLES[statusChip.variant] ?? STATUS_VARIANT_STYLES.neutral : null;
  const urgencyLabel = event.urgencyLabel;
  const categoryName = event.categoryName;
  const showCategoryChip = Boolean(categoryName);
  const isTerminalState = event.eventState === 'ended' || event.eventState === 'closed';
  const terminalBadgeSource =
    event.eventState === 'ended'
      ? require('../../assets/ended.png')
      : require('../../assets/Closed.png');

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(() => {
    Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }).start();
  }, [scaleAnim]);
  const onPressOut = useCallback(() => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.card} activeOpacity={1} onPress={openDetail} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={styles.topRow}>
          <View style={styles.textColumn}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.chipRow}>
              {statusStyle && statusChip && (
                <Chip label={statusChip.label} bg={statusStyle.bg} fg={statusStyle.fg} icon={statusStyle.icon} />
              )}
              {showCategoryChip && categoryName && (
                <Chip label={categoryName} bg="#FFF7ED" fg="#EA580C" icon="pricetag-outline" />
              )}
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.dateTime, { color: colors.textSecondary }]}>{event.dateTimeLabel}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]}>{event.location}</Text>
            </View>
            {urgencyLabel && (
              <View style={[styles.urgencyPill, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="alarm-outline" size={10} color={colors.primary} />
                <Text style={[styles.urgencyText, { color: colors.primary }]}>{urgencyLabel}</Text>
              </View>
            )}
          </View>
          <View style={styles.thumbnailWrap}>
            {event.coverImageUrl ? (
              <Image
                source={{ uri: event.coverImageUrl }}
                style={[styles.thumbnail, isTerminalState && styles.thumbnailFaded]}
                blurRadius={isTerminalState ? 10 : 0}
              />
            ) : (
              <CoverPlaceholder
                letter={event.coverLetter ?? event.title}
                gradient={(event.coverGradient ?? DEFAULT_COVER_GRADIENT) as readonly [string, string]}
                borderRadius={14}
                style={[styles.thumbnail, isTerminalState && styles.thumbnailFaded]}
                letterSize={34}
              />
            )}
            {isTerminalState ? (
              <>
                <View style={styles.thumbnailTerminalMask} />
                <Image source={terminalBadgeSource} style={styles.thumbnailTerminalBadge} resizeMode="contain" />
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            <View style={styles.attendeesRow}>
              <View style={styles.avatarStack}>
                {showPreviews ? (
                  previews.map((p, idx) => (
                    <MemberInitialAvatar
                      key={p.userId != null ? String(p.userId) : `${p.name}-${idx}`}
                      name={p.name}
                      size={28}
                      borderWidth={2}
                      style={idx > 0 ? styles.avatarOverlap : undefined}
                    />
                  ))
                ) : showAnonymousGoing ? (
                  Array.from({ length: anonymousFaceCount }, (_, idx) => (
                    <MemberInitialAvatar
                      key={`anon-${idx}`}
                      name={`Attendee ${idx + 1}`}
                      size={28}
                      borderWidth={2}
                      style={idx > 0 ? styles.avatarOverlap : undefined}
                    />
                  ))
                ) : (
                  <Ionicons name="people-outline" size={18} color="#8E929B" />
                )}
              </View>
              <Text style={styles.going}>{event.goingLabel}</Text>
            </View>
            <View
              style={[
                styles.modeTag,
                isOnline ? styles.modeTagOnline : styles.modeTagInPerson,
              ]}
            >
              <Ionicons
                name={isOnline ? 'videocam-outline' : 'people-outline'}
                size={11}
                color={isOnline ? '#139E58' : '#6F57D9'}
              />
              <Text
                style={[
                  styles.modeTagText,
                  isOnline ? styles.modeTagTextOnline : styles.modeTagTextInPerson,
                ]}
              >
                {isOnline ? 'Online' : 'In person'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={shareEvent}
              accessibilityRole="button"
              accessibilityLabel="Share event"
            >
              <Feather name="share-2" size={20} color="#8B8E9C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={toggleSave}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Remove bookmark' : 'Bookmark event'}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? '#FF7B3F' : '#8B8E9C'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: 14,
    minHeight: 96,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 7,
    lineHeight: 23,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 3,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  urgencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 3,
    marginTop: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  dateTime: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  thumbnail: {
    width: 108,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#E8EAED',
  },
  thumbnailWrap: {
    position: 'relative',
    width: 108,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
  },
  thumbnailFaded: {
    opacity: 0.65,
  },
  thumbnailTerminalMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  thumbnailTerminalBadge: {
    position: 'absolute',
    width: '88%',
    height: '62%',
    alignSelf: 'center',
    top: '19%',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarOverlap: {
    marginLeft: -9,
  },
  going: {
    marginLeft: 7,
    color: '#8E929B',
    fontWeight: '600',
    fontSize: 13,
    marginRight: 10,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
    marginLeft: 2,
  },
  modeTagOnline: {
    backgroundColor: '#EAF7EF',
  },
  modeTagInPerson: {
    backgroundColor: '#F3EEFF',
  },
  modeTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modeTagTextOnline: {
    color: '#139E58',
  },
  modeTagTextInPerson: {
    color: '#6F57D9',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 6,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
});
