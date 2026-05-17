import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import useAuth from '@/auth/useAuth';
import { mergeAuthenticatedUserFromMe } from '@/auth/mergeAuthenticatedUserFromMe';
import { pickDisplayName, pickLocationLabel } from '@/auth/normalizeUser';
import { Container } from '@/components/common/Container';
import { EventCard, type EventCardModel } from '@/components/event/EventCard';
import EmptyState from '@/components/EmptyState';
import { useSavedEvents } from '@/context/SavedEventsContext';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';
import { getEvents, invalidateEventsListCache, peekEventsListCache } from '@/api/events';
import { spacing } from '@/theme';
import NoEventsIllustration from '@/assets/no events.svg';

import { HomeHeader } from './HomeHeader';
import { YourEventsSection, type HomeEventTab } from './YourEventsSection';

const HOME_EVENTS_PARAMS = { page: 1, limit: 50, sort: 'start-asc' as const };
const GUEST_HOME_TABS: HomeEventTab[] = ['Upcoming', 'Past'];

function dedupeEventsById(items: EventCardModel[]): EventCardModel[] {
  const seen = new Set<string>();
  const unique: EventCardModel[] = [];

  for (const item of items) {
    const eventId = String(item.id);
    if (seen.has(eventId)) continue;
    seen.add(eventId);
    unique.push(item);
  }

  return unique;
}

function isPastEvent(event: EventCardModel): boolean {
  if (event.eventState === 'ended') return true;
  const startsAt = event.startsAt ? new Date(event.startsAt) : null;
  if (!startsAt || !Number.isFinite(startsAt.getTime())) return false;
  return startsAt.getTime() < Date.now() && event.eventState !== 'live';
}

function HomeScreen() {
  const { user, setUser, isLoggedIn } = useAuth();
  const isGuest = !isLoggedIn;

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#FFFFFF');
        StatusBar.setTranslucent(false);
      }
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) return undefined;
      void mergeAuthenticatedUserFromMe(setUser);
    }, [isLoggedIn, setUser]),
  );

  const { savedEventIds = [] } = useSavedEvents() || {};

  const [activeTab, setActiveTab] = useState<HomeEventTab>('Upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<EventCardModel[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasCompletedInitialLoadRef = useRef(false);

  const loadEvents = useCallback(async (options?: { manual?: boolean }) => {
    if (options?.manual) {
      invalidateEventsListCache();
    }

    const firstEver = !hasCompletedInitialLoadRef.current;
    const cached = peekEventsListCache(HOME_EVENTS_PARAMS);

    if (cached && Array.isArray(cached.items)) {
      setEvents(dedupeEventsById(cached.items as EventCardModel[]));
      setLoadError(null);
      if (firstEver) {
        setIsLoading(false);
        hasCompletedInitialLoadRef.current = true;
      }
    } else if (firstEver) {
      setIsLoading(true);
    } else if (options?.manual) {
      setRefreshing(true);
    }

    setLoadError(null);
    try {
      const { items } = await getEvents(HOME_EVENTS_PARAMS);
      setEvents(dedupeEventsById(items as EventCardModel[]));
    } catch {
      setLoadError('Could not load events. Pull to retry later.');
    } finally {
      hasCompletedInitialLoadRef.current = true;
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents]),
  );

  const activeData = useMemo(() => {
    switch (activeTab) {
      case 'Past':
        return events.filter((event) => isPastEvent(event));
      case 'Going':
        if (isGuest) return [];
        return events.filter((event: any) => event.isJoined);
      case 'Saved':
        if (isGuest) return [];
        return events.filter((e) => savedEventIds.includes(e.id));
      case 'Upcoming':
      default:
        return events.filter((event) => !isPastEvent(event));
    }
  }, [activeTab, savedEventIds, events, isGuest]);

  useEffect(() => {
    if (isGuest && !GUEST_HOME_TABS.includes(activeTab)) {
      setActiveTab('Upcoming');
    }
  }, [isGuest, activeTab]);

  const displayName = pickDisplayName(user) || 'My profile';
  const location = pickLocationLabel(user) || 'Your location';

  const renderItem: ListRenderItem<EventCardModel> = ({ item }) => (
    <EventCard event={item} variant="feed" homeTab={activeTab} />
  );

  if (isLoading) {
    return (
      <Container>
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <HomeSkeleton />
        </SafeAreaView>
      </Container>
    );
  }

  return (
    <Container>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <FlatList
          data={activeData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          overScrollMode="never"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void loadEvents({ manual: true });
                if (isLoggedIn) void mergeAuthenticatedUserFromMe(setUser);
              }}
              tintColor="#FF7B3F"
            />
          }
          ListHeaderComponent={
            <>
              <HomeHeader displayName={displayName} location={location} isGuest={isGuest} />
              <YourEventsSection
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isGuest={isGuest}
              />
            </>
          }
          ListEmptyComponent={
            loadError ? (
              <EmptyState
                title="Could not load events"
                message={loadError}
                icon="alert-circle"
              />
            ) : activeTab === 'Upcoming' ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No upcoming events</Text>
                <Text style={styles.emptyMessage}>
                  There are no upcoming events right now. Check Past events or come back soon.
                </Text>
                <NoEventsIllustration width={300} height={240} />
              </View>
            ) : (
              <EmptyState
                title={`No ${activeTab.toLowerCase()} events`}
                message="You don't have any events right now. Let's find some!"
                icon="calendar"
              />
            )
          }
          ItemSeparatorComponent={() => <View style={styles.feedSeparator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Container>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  feedSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginHorizontal: spacing.md,
    marginTop: 4,
    marginBottom: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: spacing.md,
  },
});

export default HomeScreen;
