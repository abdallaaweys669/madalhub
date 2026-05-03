import React from 'react';
import {
  Image,
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

import useAuth from '@/auth/useAuth';
import { EventMeta } from '@/components/event/EventMeta';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { spacing, useThemeColors } from '@/theme';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';

/** Readable on frosted white overlay chips over hero images (both light/dark app theme). */
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
  attendeePreviews?: { userId: number | null; name: string; avatarUrl: string | null }[];
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

type EventKind = 'online' | 'physical';

function parseEventKind(details: string): EventKind {
  const [, ...rest] = details.split('·').map((s) => s.trim());
  const locationLine = rest.join(' · ') || '';
  return locationLine.toLowerCase() === 'online' ? 'online' : 'physical';
}

type EventStatusTagProps = {
  kind: EventKind;
};

function EventStatusTag({ kind }: EventStatusTagProps) {
  const colors = useThemeColors();
  const isOnline = kind === 'online';
  const accentBg = isOnline ? colors.tagOnlineBg : colors.tagPhysicalBg;
  const accentFg = isOnline ? colors.tagOnlineFg : colors.tagPhysicalFg;

  return (
    <View style={[styles.tag, { backgroundColor: accentBg }]}>
      <Ionicons
        name={isOnline ? 'videocam-outline' : 'person-outline'}
        size={13}
        color={accentFg}
      />
      <Text style={[styles.tagLabel, { color: accentFg }]}>
        {isOnline ? 'ONLINE' : 'PHYSICAL'}
      </Text>
    </View>
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

  if (!event) {
    return null;
  }

  const isSaved = savedEventIds.includes(event.id);
  const kind = parseEventKind(event.details);
  const goingCountN = typeof event.goingCount === 'number' ? event.goingCount : 0;
  const goingLabel = `${goingCountN} going`;

  const previews = event.attendeePreviews?.filter(Boolean) ?? [];
  const showPreviews = previews.length > 0;
  const showAnonymousGoing = !showPreviews && goingCountN > 0;
  const anonymousFaceCount = Math.min(3, Math.max(1, goingCountN));

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

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => router.push(`/events/${event.id}`)}
      style={[styles.card, { backgroundColor: colors.card }, style]}
    >
      <View style={styles.imageWrap}>
        {event.coverImageUrl ? (
          <Image source={{ uri: event.coverImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <CoverPlaceholder
            letter={event.coverLetter ?? event.title}
            gradient={(event.coverGradient ?? DEFAULT_COVER_GRADIENT) as readonly [string, string]}
            borderRadius={CARD_RADIUS}
            style={styles.image}
          />
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
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>

        <EventMeta details={event.details} />

        <View style={styles.tagRow}>
          <EventStatusTag kind={kind} />
        </View>

        <View style={styles.socialRow}>
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
      </View>
    </TouchableOpacity>
  );
}

const CARD_RADIUS = 16;
const IMAGE_HEIGHT = 152;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: CARD_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
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
  imageActions: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  tagRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    minHeight: 32,
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
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
  },
});
