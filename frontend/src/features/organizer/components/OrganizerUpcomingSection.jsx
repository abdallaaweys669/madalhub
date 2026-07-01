import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import {
  formatEventMeta,
  formatOrganizerDateTime,
  organizerEventStatusChip,
  resolveOrganizerEventCoverUrl,
} from '@/features/organizer/utils/organizerEventUtils';

function EventThumbnail({ event }) {
  const coverUrl = resolveOrganizerEventCoverUrl(event);

  return (
    <View style={styles.thumbWrap}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.thumbImage} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbImage, styles.thumbFallback]}>
          <Ionicons name="calendar-outline" size={28} color="#FF7B3F" />
        </View>
      )}
    </View>
  );
}

function UpcomingEventCard({ event, onPress }) {
  const chip = organizerEventStatusChip(event);
  const isDraft = event.status === 'draft';
  const registrations = Number(event.registrationCount ?? 0);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <EventThumbnail event={event} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.chip, { backgroundColor: chip.bg }]}>
            <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {event.title?.trim() || 'Untitled event'}
        </Text>

        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={13} color="#94A3B8" />
          <Text style={styles.dateText} numberOfLines={1}>
            {isDraft ? 'Schedule not set' : formatOrganizerDateTime(event.startsAt)}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {formatEventMeta(event)}
          </Text>
          <View style={styles.footerEnd}>
            {event.status === 'published' ? (
              <View style={styles.registrations}>
                <Ionicons name="people-outline" size={12} color="#64748B" />
                <Text style={styles.registrationsText}>{registrations}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function OrganizerUpcomingSection({ events = [], totalCount = 0, onCreateEvent }) {
  const router = useGuardedRouter();
  const remaining = Math.max(0, totalCount - events.length);

  const openEvent = (event) => {
    if (event.status === 'draft') {
      router.push({ pathname: '/(organizer)/edit-event', params: { eventId: event.id } });
      return;
    }
    router.push({ pathname: '/(organizer)/manage-event', params: { eventId: event.id } });
  };

  if (!events.length) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next up</Text>
        </View>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="sparkles-outline" size={22} color="#EA580C" />
          </View>
          <Text style={styles.emptyTitle}>Nothing on the calendar yet</Text>
          <Text style={styles.emptySubtitle}>Create your next event and it will show up here.</Text>
          {onCreateEvent ? (
            <Pressable onPress={onCreateEvent} style={({ pressed }) => [styles.emptyCta, pressed && styles.cardPressed]}>
              <Text style={styles.emptyCtaText}>+ Create event</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Next up</Text>
          {totalCount > 1 ? (
            <Text style={styles.sectionSubtitle}>
              {totalCount} upcoming · soonest first
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push('/(organizer)/(tabs)/events')}
          hitSlop={8}
          style={({ pressed }) => [styles.viewAll, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="arrow-forward" size={14} color="#EA580C" />
        </Pressable>
      </View>

      <View style={styles.list}>
        {events.map((event) => (
          <UpcomingEventCard key={event.id} event={event} onPress={() => openEvent(event)} />
        ))}
      </View>

      {remaining > 0 ? (
        <Pressable
          onPress={() => router.push('/(organizer)/(tabs)/events')}
          style={({ pressed }) => [styles.moreButton, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.moreButtonText}>+{remaining} more upcoming events</Text>
          <Ionicons name="chevron-forward" size={16} color="#EA580C" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  emptyWrap: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFE4D4',
    padding: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#C2410C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  thumbWrap: {
    width: 132,
    height: 94,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    flexShrink: 0,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 22,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  dateText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  footerEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registrations: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  registrationsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  moreButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    backgroundColor: '#FFF7ED',
  },
  moreButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: 14,
    backgroundColor: '#FF7B3F',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
