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
import { Ionicons } from '@expo/vector-icons';

import { Container } from '@/components/common/Container';
import {
  CategoryTabs,
  type ExploreCategory,
} from '@/components/explore/CategoryTabs';
import {
  ExploreEventCard,
  type ExploreEventCardModel,
} from '@/components/explore/ExploreEventCard';
import {
  FilterModal,
  type ExploreFilters,
} from '@/components/filters/FilterModal';
import { SearchBar } from '@/components/explore/SearchBar';
import ExploreSkeleton from '@/components/skeletons/ExploreSkeleton';
import {
  getEventInterests,
  getEvents,
  invalidateEventsListCache,
  mapApiEventToCard,
  peekEventsListCache,
} from '@/api/events';
import { spacing } from '@/theme';

const SECTION_GAP = 14;

const DEFAULT_EXPLORE_CATEGORIES: ExploreCategory[] = [{ id: 'All', icon: 'apps-outline' }];
const CATEGORY_ICONS: ExploreCategory['icon'][] = [
  'ticket-outline',
  'football-outline',
  'color-palette-outline',
  'briefcase-outline',
  'school-outline',
  'mic-outline',
  'people-outline',
];

type ExploreRow = ExploreEventCardModel & {
  startsAt: string;
  city: string;
  isOnline: boolean;
  priceType: 'Free' | 'Paid';
  interestId: number | null;
  statusChip?: { label: string; variant: string };
  urgencyLabel?: string | null;
  categoryName?: string | null;
  eventState?: 'upcoming' | 'live' | 'fully-booked' | 'closed' | 'ended';
};

const USER_CITY = 'Mogadishu';
const STARTING_SOON_HOURS = 48;

function buildExploreParams(args: {
  debouncedSearchQuery: string;
  activeCategory: string;
  interestIdByName: Record<string, number>;
  selectedFilters: ExploreFilters;
}) {
  const { debouncedSearchQuery, activeCategory, interestIdByName, selectedFilters } = args;
  const params: Record<string, string | number> = {
    page: 1,
    limit: 50,
    sort: selectedFilters.quickPickRule === 'sortByAttendees' ? 'popular' : 'start-asc',
  };

  if (debouncedSearchQuery) params.q = debouncedSearchQuery;

  if (activeCategory !== 'All' && interestIdByName[activeCategory]) {
    params.interestId = interestIdByName[activeCategory];
  }

  params.type =
    selectedFilters.type === 'In-person'
      ? 'in-person'
      : selectedFilters.type === 'Online'
        ? 'online'
        : 'any';
  params.price = selectedFilters.price.toLowerCase();

  if (selectedFilters.location === 'In my city' || selectedFilters.location === 'Near me') {
    params.city = USER_CITY;
  }

  const dateBucket =
    selectedFilters.date === 'Any time'
      ? undefined
      : selectedFilters.date === 'Upcoming'
        ? 'upcoming'
        : selectedFilters.date === 'Today'
          ? 'today'
          : selectedFilters.date === 'Tomorrow'
            ? 'tomorrow'
            : selectedFilters.date === 'This weekend'
              ? 'this-weekend'
              : selectedFilters.date === 'Next week'
                ? 'next-week'
                : undefined;
  if (dateBucket) params.dateBucket = dateBucket;

  return params;
}

function applyQuickPickFilter(rows: ExploreRow[], filters: ExploreFilters): ExploreRow[] {
  if (filters.quickPickRule !== 'withinTwoHours') return rows;
  const now = new Date();
  const soonLimit = new Date(now.getTime() + STARTING_SOON_HOURS * 60 * 60 * 1000);
  return rows.filter((row) => {
    const startsAt = new Date(row.startsAt);
    return startsAt >= now && startsAt <= soonLimit;
  });
}

function mapItemToExploreRow(event: any): ExploreRow {
  const card = mapApiEventToCard(event);
  const startsAt = event.startsAt ?? new Date().toISOString();
  const startDate = new Date(startsAt);
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
  const isOnline = Boolean(event.isOnline);
  const city = event.city ?? '';

  return {
    id: card.id,
    title: card.title,
    dateTimeLabel: `${datePart.toUpperCase()} • ${timePart}`,
    location: isOnline ? 'Online' : city,
    coverImageUrl: card.coverImageUrl,
    coverLetter: card.coverLetter,
    coverGradient: card.coverGradient,
    goingLabel: `${card.goingCount ?? 0} going`,
    goingCount: card.goingCount ?? 0,
    attendeePreviews: card.attendeePreviews,
    mode: isOnline ? 'online' : 'in-person',
    startsAt,
    city,
    isOnline,
    priceType: event.priceType ?? 'Free',
    interestId: typeof event.interestId === 'number' ? event.interestId : null,
    statusChip: card.statusChip,
    urgencyLabel: card.urgencyLabel,
    categoryName: card.categoryName,
    eventState: card.eventState,
  };
}

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<ExploreRow[]>([]);
  const [categories, setCategories] = useState<ExploreCategory[]>(DEFAULT_EXPLORE_CATEGORIES);
  const [interestIdByName, setInterestIdByName] = useState<Record<string, number>>({});
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<ExploreFilters>({
    quickPick: null,
    date: 'Any time',
    type: 'Any',
    price: 'Any',
    location: 'Anywhere',
    quickPickRule: null,
  });

  const initialFetchDoneRef = useRef(false);
  const interestIdByNameRef = useRef(interestIdByName);
  interestIdByNameRef.current = interestIdByName;

  const interestKey = useMemo(() => {
    if (activeCategory === 'All') return 'all';
    const id = interestIdByName[activeCategory];
    return id != null ? `${activeCategory}:${id}` : `${activeCategory}:pending`;
  }, [activeCategory, interestIdByName]);

  const handleFilterPress = useCallback(() => {
    setIsFilterModalVisible(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterModalVisible(false);
  }, []);

  const handleApplyFilters = useCallback((filters: ExploreFilters) => {
    setSelectedFilters(filters);
  }, []);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#FFFFFF');
        StatusBar.setTranslucent(false);
      }
    }, []),
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    let mounted = true;

    const loadInterests = async () => {
      try {
        const interests = await getEventInterests();
        if (!mounted) return;
        const mapped = interests.map((interest: { id: number; name: string }, idx: number) => ({
          id: interest.name,
          icon: CATEGORY_ICONS[idx % CATEGORY_ICONS.length],
        }));
        setCategories([DEFAULT_EXPLORE_CATEGORIES[0], ...mapped]);
        setInterestIdByName(
          interests.reduce(
            (acc: Record<string, number>, interest: { id: number; name: string }) => {
              acc[interest.name] = interest.id;
              return acc;
            },
            {},
          ),
        );
      } catch {
        // Keep default categories if request fails.
      }
    };

    loadInterests();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchExploreEvents = useCallback(async () => {
    const params = buildExploreParams({
      debouncedSearchQuery,
      activeCategory,
      interestIdByName: interestIdByNameRef.current,
      selectedFilters,
    });
    const { items } = await getEvents(params);
    const nextRows = applyQuickPickFilter(items.map(mapItemToExploreRow), selectedFilters);
    return nextRows;
  }, [debouncedSearchQuery, activeCategory, selectedFilters]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const isFirstLoad = !initialFetchDoneRef.current;
      const params = buildExploreParams({
        debouncedSearchQuery,
        activeCategory,
        interestIdByName: interestIdByNameRef.current,
        selectedFilters,
      });
      const cached = peekEventsListCache(params);
      const paintedFromCache = Boolean(cached && Array.isArray(cached.items));

      if (paintedFromCache) {
        const fromCache = applyQuickPickFilter(
          cached!.items.map(mapItemToExploreRow),
          selectedFilters,
        );
        setRows(fromCache);
        setLoadError(null);
        if (isFirstLoad) {
          setIsLoading(false);
        }
      } else if (isFirstLoad) {
        setIsLoading(true);
      } else {
        setRefreshing(true);
      }

      setLoadError(null);
      try {
        const nextRows = await fetchExploreEvents();
        if (!mounted) return;
        setRows(nextRows);
      } catch {
        if (!mounted) return;
        if (!paintedFromCache) {
          setRows([]);
        }
        setLoadError('Could not load explore events. Please try again.');
      } finally {
        if (!mounted) return;
        initialFetchDoneRef.current = true;
        setIsLoading(false);
        setRefreshing(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [debouncedSearchQuery, interestKey, selectedFilters, fetchExploreEvents]);

  const onRefresh = useCallback(async () => {
    invalidateEventsListCache();
    setRefreshing(true);
    setLoadError(null);
    try {
      const nextRows = await fetchExploreEvents();
      setRows(nextRows);
    } catch {
      setLoadError('Could not load explore events. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchExploreEvents]);

  const renderItem: ListRenderItem<ExploreRow> = useCallback(
    ({ item }) => <ExploreEventCard event={item} />,
    [],
  );

  const keyExtractor = useCallback((item: ExploreRow) => item.id, []);

  if (isLoading) {
    return (
      <Container>
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <ExploreSkeleton />
        </SafeAreaView>
      </Container>
    );
  }

  return (
    <Container>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.pad}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFilterPress={handleFilterPress}
          />
          <View style={styles.sectionSpacer} />
          <CategoryTabs
            categories={categories}
            activeId={activeCategory}
            onChange={setActiveCategory}
          />
          <View style={styles.sectionSpacer} />
        </View>

        <FlatList
          data={rows}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF7B3F" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color="#CED4DA" />
              <Text style={styles.emptyText}>
                {loadError ?? 'No events found matching your criteria.'}
              </Text>
            </View>
          }
        />

        <FilterModal
          visible={isFilterModalVisible}
          onClose={handleCloseFilters}
          onApply={handleApplyFilters}
          initialFilters={selectedFilters}
        />
      </SafeAreaView>
    </Container>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionSpacer: {
    height: SECTION_GAP,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});
