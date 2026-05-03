import React from 'react';
import {
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
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
};

type ExploreEventCardProps = {
  event: ExploreEventCardModel;
};

function AttendeeFace({
  avatarUrl,
  name,
  style,
}: {
  avatarUrl: string | null;
  name: string;
  style: ViewStyle | ViewStyle[];
}) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={style} />;
  }
  return (
    <View style={[style, { backgroundColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' }]}>
      <Ionicons name="person" size={12} color="#FFFFFF" accessibilityLabel={name} />
    </View>
  );
}

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

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={openDetail}>
      <View style={styles.topRow}>
        <View style={styles.textColumn}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.dateTime, { color: colors.textSecondary }]}>{event.dateTimeLabel}</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.location, { color: colors.textSecondary }]}>{event.location}</Text>
          </View>
        </View>
        {event.coverImageUrl ? (
          <Image source={{ uri: event.coverImageUrl }} style={styles.thumbnail} />
        ) : (
          <CoverPlaceholder
            letter={event.coverLetter ?? event.title}
            gradient={event.coverGradient ?? DEFAULT_COVER_GRADIENT}
            borderRadius={14}
            style={styles.thumbnail}
            letterSize={34}
          />
        )}
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.bottomLeft}>
          <View style={styles.attendeesRow}>
            <View style={styles.avatarStack}>
              {showPreviews ? (
                previews.map((p, idx) => (
                  <AttendeeFace
                    key={p.userId != null ? String(p.userId) : `${p.name}-${idx}`}
                    avatarUrl={p.avatarUrl}
                    name={p.name}
                    style={[styles.avatar, idx > 0 && styles.avatarOverlap]}
                  />
                ))
              ) : showAnonymousGoing ? (
                Array.from({ length: anonymousFaceCount }, (_, idx) => (
                  <AttendeeFace
                    key={`anon-${idx}`}
                    avatarUrl={null}
                    name="Attendee"
                    style={[styles.avatar, idx > 0 && styles.avatarOverlap]}
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
              {isOnline ? 'ONLINE' : 'IN-PERSON'}
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: 12,
    minHeight: 88,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#42454D',
    marginBottom: 4,
    lineHeight: 22,
  },
  dateTime: {
    marginLeft: 4,
    fontSize: 11,
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
  },
  thumbnail: {
    width: 94,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#E8EAED',
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
    fontSize: 12,
    marginRight: 10,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    fontSize: 8,
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
  },
  iconBtn: {
    marginLeft: 6,
    padding: 4,
  },
});
