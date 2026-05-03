import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import useAuth from '@/auth/useAuth';
import { Container } from '@/components/common/Container';
import { EventCard, type EventCardModel } from '@/components/event/EventCard';
import EmptyState from '@/components/EmptyState';
import { useSavedEvents } from '@/context/SavedEventsContext';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';
import { getEvents, invalidateEventsListCache, peekEventsListCache } from '@/api/events';
import { spacing } from '@/theme';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

import { HomeHeader } from './HomeHeader';
import { YourEventsSection, type HomeEventTab } from './YourEventsSection';

const HOME_EVENTS_PARAMS = { page: 1, limit: 50, sort: 'start-asc' as const };

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

function HomeScreen() {
  const { user, isLoggedIn } = useAuth();
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
    if (isGuest) {
      return events;
    }

    switch (activeTab) {
      case 'Going':
        return events.filter((event: any) => event.isJoined);
      case 'Saved':
        return events.filter((e) => savedEventIds.includes(e.id));
      case 'Upcoming':
      default:
        return events;
    }
  }, [activeTab, savedEventIds, events, isGuest]);

  useEffect(() => {
    if (isGuest && activeTab !== 'Upcoming') {
      setActiveTab('Upcoming');
    }
  }, [isGuest, activeTab]);

  const displayName = user?.fullName || user?.name || user?.firstName || 'My profile';
  const location = user?.location || 'Your location';
  const rawAvatar = user?.avatarUrl?.trim() || user?.profileImg?.trim();
  const avatarUri = resolveApiAssetUrl(rawAvatar);

  const renderItem: ListRenderItem<EventCardModel> = ({ item }) => <EventCard event={item} />;

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void loadEvents({ manual: true });
              }}
              tintColor="#FF7B3F"
            />
          }
          ListHeaderComponent={
            <>
              <HomeHeader
                displayName={displayName}
                location={location}
                avatarUri={avatarUri}
                isGuest={isGuest}
              />
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
            ) : (
              <EmptyState
                title={`No ${activeTab.toLowerCase()} events`}
                message="You don't have any events right now. Let's find some!"
                icon="calendar"
              />
            )
          }
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
});

export default HomeScreen;
