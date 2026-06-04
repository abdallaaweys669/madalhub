import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';

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
import useAuth from '@/auth/useAuth';
import {
  getEventInterests,
  getEvents,
  invalidateEventsListCache,
  mapApiEventToCard,
  peekEventsListCache,
} from '@/api/events';
import { spacing } from '@/theme';
import { formatEventScheduleLabels } from '@/utils/formatEventSchedule';

const SECTION_GAP = 8;
const NO_EVENTS_IMAGE = require('../../assets/no events.png');

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
  eventFormat?: string | null;
  interestId: number | null;
  statusChip?: { label: string; variant: string };
  urgencyLabel?: string | null;
  categoryName?: string | null;
  eventState?: 'upcoming' | 'live' | 'fully-booked' | 'closed' | 'ended';
  locationLatitude: number;
  locationLongitude: number;
};

const USER_CITY = 'Mogadishu';
const STARTING_SOON_HOURS = 48;
const NEAR_ME_RADIUS_KM = 25;

type Coordinates = { latitude: number; longitude: number };

function extractCityFromLocation(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return USER_CITY;
  return raw.split(',').map((part) => part.trim()).filter(Boolean)[0] || USER_CITY;
}

function haversineKm(a: Coordinates, b: Coordinates) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function buildExploreParams(args: {
  debouncedSearchQuery: string;
  activeCategory: string;
  interestIdByName: Record<string, number>;
  selectedFilters: ExploreFilters;
  userCity: string;
}) {
  const { debouncedSearchQuery, activeCategory, interestIdByName, selectedFilters, userCity } = args;
  const params: Record<string, string | number> = {
    page: 1,
    limit: 20,
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
  if (selectedFilters.format !== 'Any') {
    params.eventFormat = selectedFilters.format;
  }

  if (selectedFilters.location === 'In my city') {
    params.city = userCity;
  }

  const dateBucket =
    selectedFilters.date === 'Any time' || selectedFilters.date === 'Upcoming'
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

function isEndedExploreEvent(row: ExploreRow): boolean {
  if (row.eventState === 'ended' || row.eventState === 'closed') return true;
  const startsAt = new Date(row.startsAt);
  if (!Number.isFinite(startsAt.getTime())) return false;
  return startsAt.getTime() < Date.now() && row.eventState !== 'live';
}

function applyClientFilters(
  rows: ExploreRow[],
  filters: ExploreFilters,
  nearMeCoords: Coordinates | null,
): ExploreRow[] {
  let filteredRows = rows.filter((row) => !isEndedExploreEvent(row));

  if (filters.location === 'Near me' && nearMeCoords) {
    filteredRows = filteredRows.filter((row) => {
      if (row.isOnline) return false;
      if (!Number.isFinite(row.locationLatitude) || !Number.isFinite(row.locationLongitude)) {
        return false;
      }
      return (
        haversineKm(nearMeCoords, {
          latitude: row.locationLatitude,
          longitude: row.locationLongitude,
        }) <= NEAR_ME_RADIUS_KM
      );
    });
  }

  if (filters.quickPickRule !== 'withinTwoHours') return filteredRows;
  const now = new Date();
  const soonLimit = new Date(now.getTime() + STARTING_SOON_HOURS * 60 * 60 * 1000);
  return filteredRows.filter((row) => {
    const startsAt = new Date(row.startsAt);
    return startsAt >= now && startsAt <= soonLimit;
  });
}

function formatEventFormatLabel(format?: string | null) {
  if (!format || format === 'Any') return null;
  return format.charAt(0).toUpperCase() + format.slice(1);
}

function buildEventChips(
  categoryName?: string | null,
  eventFormat?: string | null,
  isOnline?: boolean,
) {
  const chips: { label: string; type: 'category' | 'format' | 'mode'; variant?: string }[] = [];
  if (categoryName?.trim()) {
    chips.push({ label: categoryName.trim(), type: 'category' });
  }
  const formatKey = eventFormat && eventFormat !== 'Any' ? String(eventFormat).toLowerCase() : null;
  const formatLabel = formatEventFormatLabel(eventFormat);
  if (
    formatLabel &&
    !chips.some((chip) => chip.label.toLowerCase() === formatLabel.toLowerCase())
  ) {
    chips.push({ label: formatLabel, type: 'format', variant: formatKey ?? undefined });
  }
  const modeKey = isOnline ? 'online' : 'in-person';
  chips.push({
    label: isOnline ? 'Online' : 'In-person',
    type: 'mode',
    variant: modeKey,
  });
  return chips;
}

function mapItemToExploreRow(event: any): ExploreRow {
  const card =
    event?.coverImageUrl !== undefined || event?.coverLetter !== undefined || event?.details !== undefined
      ? event
      : mapApiEventToCard(event);
  const startsAt = card.startsAt ?? event.startsAt ?? new Date().toISOString();
  const endsAt = card.endsAt ?? event.endsAt ?? event.endDatetime ?? null;
  const { dateLabel, timeLabel, dateTimeLabel } = formatEventScheduleLabels(startsAt, endsAt);
  const isOnline = Boolean(card.isOnline ?? event.isOnline);
  const city = card.city ?? event.city ?? '';
  const locationName =
    typeof card.locationName === 'string' && card.locationName.trim()
      ? card.locationName.trim()
      : typeof event.locationName === 'string' && event.locationName.trim()
        ? event.locationName.trim()
        : '';
  const locationLabel = isOnline
    ? 'Online'
    : locationName && city
      ? `${locationName}, ${city}`
      : locationName || city || 'Location TBA';
  const priceAmount = card.priceAmount ?? event.priceAmount ?? null;
  const priceType = card.priceType ?? event.priceType ?? 'Free';
  const priceLabel =
    priceType === 'Paid' && typeof priceAmount === 'number' && priceAmount > 0
      ? `$${priceAmount.toFixed(priceAmount % 1 === 0 ? 0 : 2)}`
      : 'Free';
  const eventFormat = card.eventFormat ?? event.eventFormat ?? null;
  const categoryName = card.categoryName ?? null;
  const eventChips = buildEventChips(categoryName, eventFormat, isOnline);

  return {
    id: card.id,
    title: card.title,
    dateTimeLabel,
    dateLabel,
    timeLabel,
    location: locationLabel,
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
    priceType: card.priceType ?? event.priceType ?? 'Free',
    priceLabel,
    eventFormat,
    interestId: typeof card.interestId === 'number' ? card.interestId : null,
    statusChip: card.statusChip,
    urgencyLabel: card.urgencyLabel,
    categoryName,
    eventChips,
    eventState: card.eventState,
    locationLatitude: Number(card.locationLatitude),
    locationLongitude: Number(card.locationLongitude),
  };
}

export default function ExploreScreen() {
  const { user } = useAuth();
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
  const [nearMeCoords, setNearMeCoords] = useState<Coordinates | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<ExploreFilters>({
    quickPick: null,
    date: 'Any time',
    type: 'Any',
    format: 'Any',
    price: 'Any',
    location: 'Anywhere',
    quickPickRule: null,
  });

  const initialFetchDoneRef = useRef(false);
  const interestIdByNameRef = useRef(interestIdByName);
  interestIdByNameRef.current = interestIdByName;
  const userCity = useMemo(
    () => extractCityFromLocation(user?.location || user?.city),
    [user?.city, user?.location],
  );

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

  const handleApplyFilters = useCallback(async (filters: ExploreFilters) => {
    if (filters.location !== 'Near me') {
      setNearMeCoords(null);
      setSelectedFilters(filters);
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Allow location access to show nearby events.');
        setNearMeCoords(null);
        setSelectedFilters({ ...filters, location: 'Anywhere' });
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setNearMeCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setSelectedFilters(filters);
    } catch {
      Alert.alert('Location unavailable', 'We could not get your location. Try again or use In my city.');
      setNearMeCoords(null);
      setSelectedFilters({ ...filters, location: 'In my city' });
    }
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
      userCity,
    });
    const { items } = await getEvents(params);
    const nextRows = applyClientFilters(items.map(mapItemToExploreRow), selectedFilters, nearMeCoords);
    return nextRows;
  }, [debouncedSearchQuery, activeCategory, selectedFilters, nearMeCoords, userCity]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const isFirstLoad = !initialFetchDoneRef.current;
      const params = buildExploreParams({
        debouncedSearchQuery,
        activeCategory,
        interestIdByName: interestIdByNameRef.current,
        selectedFilters,
        userCity,
      });
      const cached = peekEventsListCache(params);
      const paintedFromCache = Boolean(cached && Array.isArray(cached.items));

      if (paintedFromCache) {
        const fromCache = applyClientFilters(
          cached!.items.map(mapItemToExploreRow),
          selectedFilters,
          nearMeCoords,
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
  }, [debouncedSearchQuery, interestKey, selectedFilters, nearMeCoords, userCity, fetchExploreEvents]);

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

  const sectionTitle = activeCategory === 'All' ? 'All Events' : `${activeCategory} Events`;

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
          ListHeaderComponent={
            rows.length ? <Text style={styles.sectionHeading}>{sectionTitle}</Text> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Image source={NO_EVENTS_IMAGE} style={styles.emptyIllustration} resizeMode="contain" />
              <Text style={styles.emptyTitle}>
                {loadError ? 'Could not load events' : 'No events found'}
              </Text>
              <Text style={styles.emptyText}>
                {loadError ?? 'Try adjusting your search or filters.'}
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
    paddingTop: 4,
    paddingBottom: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  sectionSpacer: {
    height: SECTION_GAP,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
  emptyIllustration: {
    width: 132,
    height: 132,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#6E6E72',
    textAlign: 'center',
  },
});
