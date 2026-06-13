import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ExploreEventCard } from '@/components/explore/ExploreEventCard';
import { useThemeColors } from '@/theme';
import NoEventsIllustration from '@/assets/no events.svg';

const BRAND = '#FF7A00';

function isPastByStart(event, now) {
  const startsAt = event?.startsAt ? new Date(event.startsAt) : null;
  if (!startsAt || !Number.isFinite(startsAt.getTime())) return false;
  if (event.eventState === 'ended') return true;
  if (event.eventState === 'live') return false;
  return startsAt.getTime() < now.getTime();
}

function formatDateTimeLabel(event) {
  const startDate = event.startsAt ? new Date(event.startsAt) : new Date();
  const datePart = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart.toUpperCase()} • ${timePart}`;
}

function toExploreCardEvent(event) {
  const isOnline = Boolean(event.isOnline);
  return {
    id: String(event.id),
    title: event.title,
    dateTimeLabel: formatDateTimeLabel(event),
    location: isOnline ? 'Online' : event.city || event.locationName || 'Venue TBD',
    coverImageUrl: event.coverImageUrl,
    coverLetter: event.coverLetter,
    coverGradient: event.coverGradient,
    goingLabel: `${event.goingCount ?? 0} going`,
    goingCount: event.goingCount ?? 0,
    attendeePreviews: event.attendeePreviews,
    mode: isOnline ? 'online' : 'in-person',
    statusChip: event.statusChip,
    urgencyLabel: event.urgencyLabel,
    categoryName: event.categoryName,
    eventState: event.eventState,
  };
}

function SlimTimeScope({ value, onChange, colors }) {
  const trackBg = '#EEF0F4';
  const inactiveFg = colors.textSecondary;
  return (
    <View style={[styles.slimTrack, { backgroundColor: trackBg }]}>
      <Pressable
        onPress={() => onChange('Upcoming')}
        style={({ pressed }) => [
          styles.slimSlot,
          value === 'Upcoming' && styles.slimSlotOn,
          pressed && { opacity: 0.9 },
        ]}
      >
        <Feather name="calendar" size={14} color={value === 'Upcoming' ? '#fff' : inactiveFg} />
        <Text style={[styles.slimLabel, { color: value === 'Upcoming' ? '#fff' : inactiveFg }]}>Upcoming</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('Past')}
        style={({ pressed }) => [
          styles.slimSlot,
          value === 'Past' && styles.slimSlotOn,
          pressed && { opacity: 0.9 },
        ]}
      >
        <Feather name="clock" size={14} color={value === 'Past' ? '#fff' : inactiveFg} />
        <Text style={[styles.slimLabel, { color: value === 'Past' ? '#fff' : inactiveFg }]}>Past</Text>
      </Pressable>
    </View>
  );
}

export function MemberProfileEventsSection({
  mainTab,
  onMainTabChange,
  goingEvents,
  savedEvents,
  loadingGoing,
  isSyncingSaved,
}) {
  const colors = useThemeColors();
  const [timeScope, setTimeScope] = useState('Upcoming');
  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    if (mainTab === 'saved') {
      return (savedEvents || []).filter((event) => {
        const startsAt = event?.startsAt ? new Date(event.startsAt) : null;
        if (!startsAt || !Number.isFinite(startsAt.getTime())) return timeScope === 'Upcoming';
        const past = startsAt < now;
        return timeScope === 'Past' ? past : !past;
      });
    }
    return (goingEvents || []).filter((event) => {
      const past = isPastByStart(event, now);
      return timeScope === 'Past' ? past : !past;
    });
  }, [goingEvents, savedEvents, mainTab, timeScope, now]);

  const emptyCopy =
    mainTab === 'going'
      ? timeScope === 'Upcoming'
        ? 'No upcoming events you\'re going to.'
        : 'No past events you joined.'
      : timeScope === 'Upcoming'
        ? 'You have no upcoming saved events.'
        : 'You have no past saved events.';

  const showLoader =
    mainTab === 'going'
      ? loadingGoing
      : Boolean(isSyncingSaved && (!savedEvents || savedEvents.length === 0));

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Events</Text>

      <View style={styles.mainTabs}>
        <Pressable onPress={() => onMainTabChange('going')} style={styles.mainTabHit}>
          <Text style={[styles.mainTabText, { color: colors.textSecondary }, mainTab === 'going' && { color: colors.text, fontWeight: '800' }]}>
            Going
          </Text>
          {mainTab === 'going' ? <View style={styles.mainTabUnderline} /> : <View style={styles.mainTabUnderlinePlaceholder} />}
        </Pressable>
        <Pressable onPress={() => onMainTabChange('saved')} style={styles.mainTabHit}>
          <Text style={[styles.mainTabText, { color: colors.textSecondary }, mainTab === 'saved' && { color: colors.text, fontWeight: '800' }]}>
            Saved
          </Text>
          {mainTab === 'saved' ? <View style={styles.mainTabUnderline} /> : <View style={styles.mainTabUnderlinePlaceholder} />}
        </Pressable>
      </View>

      <SlimTimeScope value={timeScope} onChange={setTimeScope} colors={colors} />

      {showLoader ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={BRAND} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBlock}>
          <NoEventsIllustration width={220} height={160} />
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{emptyCopy}</Text>
        </View>
      ) : (
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {filtered.map((event) => (
            <View key={String(event.id)} style={styles.cardWrap}>
              <ExploreEventCard event={toExploreCardEvent(event)} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  mainTabs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 28,
    marginBottom: 10,
  },
  mainTabHit: {
    paddingBottom: 8,
  },
  mainTabText: {
    fontSize: 17,
    fontWeight: '600',
  },
  mainTabUnderline: {
    marginTop: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND,
  },
  mainTabUnderlinePlaceholder: {
    marginTop: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  slimTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    height: 40,
    marginBottom: 12,
  },
  slimSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 11,
    height: 34,
  },
  slimSlotOn: {
    backgroundColor: BRAND,
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  slimLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardWrap: {
    marginBottom: 12,
  },
  loaderWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  empty: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 280,
  },
});
