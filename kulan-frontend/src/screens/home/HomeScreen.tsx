import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import useAuth from '@/auth/useAuth';
import { mergeAuthenticatedUserFromMe } from '@/auth/mergeAuthenticatedUserFromMe';
import { pickDisplayName, pickLocationLabel } from '@/auth/normalizeUser';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Container } from '@/components/common/Container';
import { type EventCardModel } from '@/components/event/EventCard';
import EmptyState from '@/components/EmptyState';
import { useSavedEvents } from '@/context/SavedEventsContext';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';
import { getEvents, getRecommendedEvents, invalidateEventsListCache, peekEventsListCache, DEFAULT_COVER_GRADIENT } from '@/api/events';
import { trackEventInteraction } from '@/api/trackEventInteraction';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { spacing, useThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';

import { HomeHeader } from './HomeHeader';
import { YourEventsSection, type HomeEventTab } from './YourEventsSection';
import { buildEventMetaBadgeLabels, EventMetaBadgeRow } from '@/components/event/EventMetaBadgeRow';
import { EventDateLocationRows } from '@/components/event/EventDateLocationRows';
import { buildEventScheduleLocationFields } from '@/utils/eventDisplay';

const HOME_EVENTS_PARAMS = { page: 1, limit: 50, sort: 'start-asc' as const };
const GUEST_HOME_TABS: HomeEventTab[] = ['Upcoming'];
const TRENDING_MIN_ATTENDEES = 20;
/** Visible sliver of the next My Events card in the horizontal carousel. */
const MY_EVENT_CARD_PEEK = 52;
/** Extra breathing room below the status bar (Home + Explore). */
const SCREEN_TOP_EXTRA = 10;
const NO_EVENTS_IMAGE = require('../../assets/no events.png');

const coverBannerImageStyle = {
  ...StyleSheet.absoluteFillObject,
  width: '100%',
  height: '100%',
} as const;

type HomeInsightSection = {
  id: 'discover';
  title: string;
  subtitle: string;
  items: EventCardModel[];
};

function normalizeInterestIds(rawInterests: unknown): number[] {
  if (!Array.isArray(rawInterests)) return [];
  return rawInterests
    .map((item) => {
      if (typeof item === 'number' && Number.isFinite(item)) return item;
      if (!item || typeof item !== 'object') return 0;
      const record = item as Record<string, unknown>;
      const id = record.id ?? record.interestId ?? record.interest_id;
      const parsed = Number(id);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    })
    .filter((id) => id > 0);
}

function normalizeInterestLabels(rawInterests: unknown): string[] {
  if (!Array.isArray(rawInterests)) return [];
  return rawInterests
    .map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return '';
      const record = item as Record<string, unknown>;
      const candidate =
        record.name ??
        record.label ??
        record.title ??
        record.value ??
        record.category ??
        record.interest;
      return typeof candidate === 'string' ? candidate : '';
    })
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function getEventSearchText(event: EventCardModel): string {
  return [event.title, event.details, event.categoryName, event.description]
    .map((v) => String(v || '').toLowerCase())
    .join(' ');
}

function getEventCreatedAtMs(event: EventCardModel): number {
  const createdRaw = (event as { createdAt?: string | number | null }).createdAt;
  if (createdRaw != null) {
    const createdAt = new Date(createdRaw).getTime();
    if (Number.isFinite(createdAt)) return createdAt;
  }
  const id = Number(event.id);
  return Number.isFinite(id) ? id : 0;
}

function sortByNewestFirst(items: EventCardModel[]): EventCardModel[] {
  return [...items].sort((a, b) => getEventCreatedAtMs(b) - getEventCreatedAtMs(a));
}

function eventId(event: EventCardModel): string {
  return String(event.id);
}

function sortByStartsSoonest(items: EventCardModel[]): EventCardModel[] {
  return [...items].sort((a, b) => {
    const aTime = a.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

function getLocationMatchScore(event: EventCardModel, userLocation: string): number {
  const locationText = userLocation.trim().toLowerCase();
  if (!locationText) return 0;

  const city = String((event as { city?: string }).city || '').trim().toLowerCase();
  const locationName = String(event.locationName || '').trim().toLowerCase();
  const searchable = getEventSearchText(event);
  const locationParts = locationText.split(',').map((part) => part.trim()).filter(Boolean);

  if (city && locationParts.some((part) => part.includes(city) || city.includes(part))) return 1;
  if (locationName && locationParts.some((part) => part.includes(locationName) || locationName.includes(part))) {
    return 0.85;
  }
  if (searchable.includes(locationText)) return 0.7;
  if (locationParts.some((part) => part.length > 2 && searchable.includes(part))) return 0.5;
  return 0;
}

function getInterestIdMatchScore(event: EventCardModel, interestIds: number[]): number {
  const eventInterestId = Number((event as { interestId?: number | null }).interestId || 0);
  if (!interestIds.length || !eventInterestId) return 0;
  return interestIds.includes(eventInterestId) ? 1 : 0;
}

function getInterestMatchScore(event: EventCardModel, interestLabels: string[]): number {
  if (!interestLabels.length) return 0;
  const searchable = getEventSearchText(event);
  const matches = interestLabels.reduce((acc, interest) => {
    if (searchable.includes(interest)) return acc + 1;
    return acc;
  }, 0);
  return Math.min(matches, 3);
}

function getCombinedInterestScore(
  event: EventCardModel,
  interestLabels: string[],
  interestIds: number[],
): number {
  const idScore = getInterestIdMatchScore(event, interestIds);
  const labelScore = getInterestMatchScore(event, interestLabels) / 3;
  return Math.max(idScore, labelScore);
}

function scoreRecommendedEvent(
  event: EventCardModel,
  interestLabels: string[],
  interestIds: number[],
  userLocation: string,
): number {
  const interestScore = getCombinedInterestScore(event, interestLabels, interestIds);
  const locationScore = getLocationMatchScore(event, userLocation);
  return interestScore * 0.85 + locationScore * 0.15;
}

function rankEventsByScore(
  items: EventCardModel[],
  scorer: (event: EventCardModel) => number,
): EventCardModel[] {
  return [...items].sort((a, b) => {
    const scoreDiff = scorer(b) - scorer(a);
    if (scoreDiff !== 0) return scoreDiff;
    const goingDiff = (Number(b.goingCount) || 0) - (Number(a.goingCount) || 0);
    if (goingDiff !== 0) return goingDiff;
    const aStarts = a.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bStarts = b.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aStarts - bStarts;
  });
}

function buildClientRecommendedEvents(
  upcomingEvents: EventCardModel[],
  interestLabels: string[],
  interestIds: number[],
  location: string,
): EventCardModel[] {
  const pool = upcomingEvents.filter((event: EventCardModel & { isJoined?: boolean }) => !event.isJoined);
  return rankEventsByScore(pool, (event) =>
    scoreRecommendedEvent(event, interestLabels, interestIds, location),
  ).slice(0, 8);
}

function HomeEventCoverActions({
  eventId,
  shareMessage,
}: {
  eventId: string | number;
  shareMessage: string;
}) {
  const router = useGuardedRouter();
  const { isLoggedIn } = useAuth();
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();
  const isSaved = savedEventIds.includes(String(eventId));

  const toggleSave = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }
    if (isSaved) unsaveEvent(eventId);
    else saveEvent(eventId);
  };

  const shareEvent = async () => {
    if (isLoggedIn) trackEventInteraction(eventId, 'shared');
    try {
      await Share.share({ message: shareMessage });
    } catch {
      /* user dismissed share sheet */
    }
  };

  return (
    <View style={styles.coverHeroActions}>
      <TouchableOpacity
        style={[styles.coverHeroActionBtn, styles.coverHeroActionBtnGlass]}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => void shareEvent()}
        accessibilityRole="button"
        accessibilityLabel="Share event"
      >
        <Feather name="share-2" size={16} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.coverHeroActionBtn,
          isSaved ? styles.coverHeroActionBtnSaved : styles.coverHeroActionBtnGlass,
        ]}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={toggleSave}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Remove bookmark' : 'Bookmark event'}
      >
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={16}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}

function getEventScheduleLocation(event: EventCardModel & { city?: string }) {
  return buildEventScheduleLocationFields({
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    locationName: event.locationName,
    locationAddress: event.locationAddress,
    city: event.city,
    isOnline: event.isOnline,
  });
}

function HomeInsightCard({ event }: { event: EventCardModel }) {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { isLoggedIn } = useAuth();
  const scheduleLocation = getEventScheduleLocation(event as EventCardModel & { city?: string });
  const shareDateLabel = scheduleLocation.datePrimary || 'Date TBA';

  useEffect(() => {
    if (isLoggedIn) trackEventInteraction(event.id, 'viewed');
  }, [event.id, isLoggedIn]);

  const openDetail = () => {
    if (isLoggedIn) trackEventInteraction(event.id, 'opened');
    router.push(`/events/${event.id}`);
  };

  return (
    <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.insightCover}>
        <Pressable onPress={openDetail} style={StyleSheet.absoluteFill}>
          {event.coverImageUrl ? (
            <Image
              source={{ uri: event.coverImageUrl }}
              style={coverBannerImageStyle}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.insightCoverFallback, { backgroundColor: colors.backgroundMuted }]}>
              <Text style={[styles.insightCoverLetter, { color: colors.textSecondary }]}>
                {(event.coverLetter || event.title || '?').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
        <View style={styles.insightCoverOverlay} />
        <HomeEventCoverActions
          eventId={event.id}
          shareMessage={`${event.title}\n${shareDateLabel}`}
        />
        <View style={styles.insightCategoryPill}>
          <Text style={styles.insightCategoryText}>{event.categoryName || 'Featured'}</Text>
        </View>
      </View>
      <Pressable onPress={openDetail} style={styles.insightBody}>
        <Text numberOfLines={2} style={[styles.insightTitle, { color: colors.text }]}>
          {event.title}
        </Text>
        <EventDateLocationRows
          datePrimary={scheduleLocation.datePrimary}
          dateSecondary={scheduleLocation.dateSecondary}
          locationPrimary={scheduleLocation.locationPrimary}
          locationSecondary={scheduleLocation.locationSecondary}
        />
      </Pressable>
    </View>
  );
}

function HomeInsightSections({ sections }: { sections: HomeInsightSection[] }) {
  const colors = useThemeColors();
  return (
    <View style={styles.insightsWrap}>
      {sections.map((section) => {
        if (!section.items.length) return null;
        return (
          <View key={section.id} style={styles.insightSection}>
            <View style={styles.insightSectionHead}>
              <Text style={[styles.insightSectionTitle, { color: colors.text }]}>{section.title}</Text>
              {section.subtitle ? (
                <Text style={[styles.insightSectionSubtitle, { color: colors.textSecondary }]}>
                  {section.subtitle}
                </Text>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.insightRowContent}
            >
              {section.items.map((event) => (
                <HomeInsightCard key={`${section.id}-${event.id}`} event={event} />
              ))}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

function RecommendedMiniCard({ event }: { event: EventCardModel }) {
  const colors = useThemeColors();
  const router = useGuardedRouter();
  const { isLoggedIn } = useAuth();
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();
  const isSaved = savedEventIds.includes(String(event.id));

  const scheduleLocation = getEventScheduleLocation(event as EventCardModel & { city?: string });
  const categoryLabel = (event.categoryName || 'Featured').trim().toUpperCase();

  useEffect(() => {
    if (isLoggedIn) trackEventInteraction(event.id, 'viewed');
  }, [event.id, isLoggedIn]);

  const openDetail = () => {
    if (isLoggedIn) trackEventInteraction(event.id, 'opened');
    router.push(`/events/${event.id}`);
  };

  const shareEvent = async () => {
    if (isLoggedIn) trackEventInteraction(event.id, 'shared');
    try {
      await Share.share({
        message: `${event.title}\n${scheduleLocation.datePrimary} · ${scheduleLocation.dateSecondary}`,
      });
    } catch {
      /* user dismissed share sheet */
    }
  };

  const toggleSave = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }
    if (isSaved) unsaveEvent(event.id);
    else saveEvent(event.id);
  };

  return (
    <View style={[styles.recommendedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.recommendedLeftCol}>
        <Pressable onPress={openDetail} style={styles.recommendedImageWrap}>
          {event.coverImageUrl ? (
            <Image
              source={{ uri: event.coverImageUrl }}
              style={coverBannerImageStyle}
              resizeMode="cover"
            />
          ) : (
            <CoverPlaceholder
              letter={event.coverLetter ?? event.title}
              gradient={(event.coverGradient ?? DEFAULT_COVER_GRADIENT) as readonly [string, string]}
              borderRadius={12}
              style={styles.coverBannerFill}
              letterSize={36}
            />
          )}
        </Pressable>
        <View style={styles.recommendedActionsRow}>
          <TouchableOpacity
            style={styles.recommendedActionBtn}
            onPress={() => void shareEvent()}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Share event"
          >
            <Feather name="share-2" size={15} color="#9CA3AF" />
            <Text style={styles.recommendedActionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.recommendedActionBtn}
            onPress={toggleSave}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove bookmark' : 'Save event'}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isSaved ? colors.primary : '#9CA3AF'}
            />
            <Text style={[styles.recommendedActionText, isSaved && { color: colors.primary }]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Pressable onPress={openDetail} style={styles.recommendedRightCol}>
        <View style={styles.recommendedCategoryPill}>
          <Text style={styles.recommendedCategoryText}>{categoryLabel}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.recommendedCardTitle, { color: colors.text }]}>
          {event.title}
        </Text>
        <EventDateLocationRows
          datePrimary={scheduleLocation.datePrimary}
          dateSecondary={scheduleLocation.dateSecondary}
          locationPrimary={scheduleLocation.locationPrimary}
          locationSecondary={scheduleLocation.locationSecondary}
        />
      </Pressable>
    </View>
  );
}

function formatMyEventPriceLabel(event: EventCardModel): string {
  const priceType = event.priceType ?? 'Free';
  const priceAmount = event.priceAmount;
  if (priceType === 'Paid' && typeof priceAmount === 'number' && priceAmount > 0) {
    return `$${priceAmount.toFixed(priceAmount % 1 === 0 ? 0 : 2)}`;
  }
  return 'Free';
}

function HomeMyEventCard({
  event,
  activeTab,
  cardWidth,
}: {
  event: EventCardModel;
  activeTab: HomeEventTab;
  cardWidth?: number;
}) {
  const colors = useThemeColors();
  const router = useGuardedRouter();
  const { isLoggedIn } = useAuth();
  const scheduleLocation = getEventScheduleLocation(event as EventCardModel & { city?: string });
  const goingCountN = Math.max(0, Number(event.goingCount) || 0);
  const goingLabel = `${goingCountN} going`;
  const previews = event.attendeePreviews?.filter(Boolean) ?? [];
  const showPreviews = previews.length > 0;
  const showAnonymousGoing = !showPreviews && goingCountN > 0;
  const anonymousFaceCount = Math.min(3, Math.max(1, goingCountN));
  const statusLabel = event.urgencyLabel || event.statusChip?.label;
  const priceLabel = formatMyEventPriceLabel(event);
  const showGoingBadge = activeTab === 'Joined' || Boolean((event as { isJoined?: boolean }).isJoined);
  const imageHeight = cardWidth ? Math.round(cardWidth * 0.62) : 176;

  const openDetail = () => {
    if (isLoggedIn) trackEventInteraction(event.id, 'opened');
    router.push(`/events/${event.id}`);
  };

  return (
    <View
      style={[
        styles.myEventCard,
        { width: cardWidth ?? 300, backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.myEventImageWrap, { height: imageHeight }]}>
        <Pressable onPress={openDetail} style={StyleSheet.absoluteFill}>
          {event.coverImageUrl ? (
            <Image
              source={{ uri: event.coverImageUrl }}
              style={coverBannerImageStyle}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.myEventImageFallback, { backgroundColor: colors.backgroundMuted }]}>
              <Text style={[styles.myEventFallbackLetter, { color: colors.textSecondary }]}>
                {(event.coverLetter || event.title || '?').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
        <HomeEventCoverActions
          eventId={event.id}
          shareMessage={`${event.title}\n${scheduleLocation.datePrimary} · ${scheduleLocation.dateSecondary}`}
        />
        <View style={styles.myEventHeroTopLeft}>
          <View style={styles.myEventPriceBadge}>
            <Text style={styles.myEventPriceBadgeText}>{priceLabel}</Text>
          </View>
          {showGoingBadge ? (
            <View style={styles.myEventJoinedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#15803D" />
              <Text style={styles.myEventBadgeText}>Joined</Text>
            </View>
          ) : null}
        </View>
        {statusLabel ? (
          <View style={styles.myEventStatusBadge}>
            <Ionicons name="timer-outline" size={12} color="#FFFFFF" />
            <Text style={styles.myEventStatusBadgeText}>{statusLabel}</Text>
          </View>
        ) : null}
      </View>
      <Pressable onPress={openDetail} style={styles.myEventBody}>
        <EventMetaBadgeRow
          labels={buildEventMetaBadgeLabels({
            categoryName: event.categoryName,
            eventFormat: event.eventFormat,
            isOnline: event.isOnline,
          })}
        />
        <Text numberOfLines={2} style={[styles.myEventTitle, { color: colors.text }]}>
          {event.title}
        </Text>
        <EventDateLocationRows
          datePrimary={scheduleLocation.datePrimary}
          dateSecondary={scheduleLocation.dateSecondary}
          locationPrimary={scheduleLocation.locationPrimary}
          locationSecondary={scheduleLocation.locationSecondary}
        />
        <View style={styles.myEventFooter}>
          <View style={styles.myEventAvatarStack}>
            {showPreviews ? (
              previews.slice(0, 3).map((preview, index) => (
                <MemberInitialAvatar
                  key={
                    preview.userId != null
                      ? String(preview.userId)
                      : `${preview.name}-${index}`
                  }
                  name={preview.name}
                  size={26}
                  borderWidth={2}
                  style={index > 0 ? styles.myEventAvatarOverlap : undefined}
                />
              ))
            ) : showAnonymousGoing ? (
              Array.from({ length: anonymousFaceCount }, (_, index) => (
                <MemberInitialAvatar
                  key={`anon-${index}`}
                  name={`Attendee ${index + 1}`}
                  size={26}
                  borderWidth={2}
                  style={index > 0 ? styles.myEventAvatarOverlap : undefined}
                />
              ))
            ) : (
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
            )}
          </View>
          <Text style={[styles.myEventGoingText, { color: colors.textSecondary }]}>{goingLabel}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function GuestUpcomingSection({
  events,
  cardWidth,
  onSeeAll,
}: {
  events: EventCardModel[];
  cardWidth: number;
  onSeeAll: () => void;
}) {
  const colors = useThemeColors();
  const router = useGuardedRouter();

  return (
    <View style={styles.guestUpcomingSection}>
      <View style={styles.guestUpcomingHead}>
        <Text style={[styles.guestUpcomingTitle, { color: colors.text }]}>Upcoming Events</Text>
        {events.length > 2 ? (
          <TouchableOpacity activeOpacity={0.8} onPress={onSeeAll}>
            <Text style={[styles.guestUpcomingSeeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {events.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.myEventsRow}
          nestedScrollEnabled
        >
          {events.map((event) => (
            <HomeMyEventCard
              key={`guest-upcoming-${event.id}`}
              event={event}
              activeTab="Upcoming"
              cardWidth={cardWidth}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={NO_EVENTS_IMAGE} style={styles.emptyIllustration} resizeMode="contain" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No upcoming events</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            Discover events happening near you.
          </Text>
          <TouchableOpacity
            style={[styles.emptyCta, { backgroundColor: colors.primary }]}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.emptyCtaText}>Explore Events</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getEventGoingCount(event: EventCardModel): number {
  return Math.max(0, Number(event.goingCount) || 0);
}

function formatTrendingAttendingLabel(count: number): string {
  if (count >= 1000) {
    const thousands = count / 1000;
    const label = thousands % 1 === 0 ? `${thousands.toFixed(0)}k` : `${thousands.toFixed(1)}k`;
    return `+${label} attending`;
  }
  return `+${count} attending`;
}

function scoreTrendingEvent(event: EventCardModel): number {
  return getEventGoingCount(event);
}

function TrendingHeroCard({ event }: { event: EventCardModel | null }) {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  if (!event) return null;

  const goingCount = getEventGoingCount(event);
  const showTrendingBadge = goingCount >= TRENDING_MIN_ATTENDEES;
  const subtitle =
    String(event.details || event.description || '').trim() ||
    (event.categoryName ? `Join others exploring ${event.categoryName.toLowerCase()}.` : 'Join others at this event.');
  const previews = event.attendeePreviews?.filter(Boolean).slice(0, 3) ?? [];

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={[styles.popularHeroCard, { borderColor: colors.border }]}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={styles.popularHeroImageWrap}>
        {event.coverImageUrl ? (
          <Image
            source={{ uri: event.coverImageUrl }}
            style={coverBannerImageStyle}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#0F172A', '#1E3A8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverBannerFill}
          />
        )}
        <LinearGradient
          colors={['rgba(15,23,42,0.15)', 'rgba(15,23,42,0.82)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.popularHeroOverlay}
        />
      </View>

      {showTrendingBadge ? (
        <View style={styles.popularMostAttendedChip}>
          <Ionicons name="flame" size={11} color="#FFFFFF" />
          <Text style={styles.popularMostAttendedText}>Trending</Text>
        </View>
      ) : null}

      <View style={styles.popularHeroContent}>
        <View style={styles.popularHeroCopy}>
          <Text numberOfLines={2} style={styles.popularHeroTitle}>
            {event.title}
          </Text>
          <Text numberOfLines={2} style={styles.popularHeroSubtitle}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.popularHeroFooter}>
          <View style={styles.popularAttendingRow}>
            {previews.length ? (
              <View style={styles.popularAvatarStack}>
                {previews.map((preview, index) => (
                  <View
                    key={preview.userId != null ? String(preview.userId) : `${preview.name}-${index}`}
                    style={index > 0 ? styles.popularAvatarOverlap : undefined}
                  >
                    <MemberInitialAvatar name={preview.name} size={28} borderWidth={2} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.popularAvatarStack}>
                {[0, 1, 2].map((index) => (
                  <View key={index} style={[styles.popularAvatarPlaceholder, index > 0 && styles.popularAvatarOverlap]} />
                ))}
              </View>
            )}
            <Text style={styles.popularAttendingText}>{formatTrendingAttendingLabel(goingCount)}</Text>
          </View>

          <View style={styles.popularCtaPill}>
            <Text style={[styles.popularCtaText, { color: colors.primary }]}>View Event</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

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
  const colors = useThemeColors();
  const router = useGuardedRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { user, setUser, isLoggedIn } = useAuth();
  const isGuest = !isLoggedIn;
  const guestEventCardWidth = Math.floor((screenWidth - spacing.md * 2 - spacing.sm) / 2);
  const myEventCardWidth = useMemo(
    () => Math.floor(screenWidth - spacing.md * 2 - MY_EVENT_CARD_PEEK),
    [screenWidth],
  );

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
  const [recommendedEvents, setRecommendedEvents] = useState<EventCardModel[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasCompletedInitialLoadRef = useRef(false);

  const loadRecommended = useCallback(
    async (upcomingPool: EventCardModel[], options?: { fallbackLabels?: string[]; fallbackIds?: number[]; fallbackLocation?: string }) => {
      if (!isLoggedIn) {
        setRecommendedEvents([]);
        return;
      }
      try {
        const { items } = await getRecommendedEvents({ limit: 8 });
        setRecommendedEvents(items);
      } catch {
        setRecommendedEvents(
          buildClientRecommendedEvents(
            upcomingPool,
            options?.fallbackLabels ?? [],
            options?.fallbackIds ?? [],
            options?.fallbackLocation ?? '',
          ),
        );
      }
    },
    [isLoggedIn],
  );

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
      const deduped = dedupeEventsById(items as EventCardModel[]);
      setEvents(deduped);
      if (isLoggedIn) {
        const interestLabels = normalizeInterestLabels(
          (user as { interests?: unknown } | null)?.interests,
        );
        const interestIds = normalizeInterestIds(
          (user as { interests?: unknown } | null)?.interests,
        );
        const userLocation = pickLocationLabel(user) || '';
        const upcomingPool = sortByStartsSoonest(
          deduped.filter((event) => !isPastEvent(event)),
        );
        await loadRecommended(upcomingPool, {
          fallbackLabels: interestLabels,
          fallbackIds: interestIds,
          fallbackLocation: userLocation,
        });
      } else {
        setRecommendedEvents([]);
      }
    } catch {
      setLoadError('Could not load events. Pull to retry later.');
    } finally {
      hasCompletedInitialLoadRef.current = true;
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isLoggedIn, loadRecommended, user]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents]),
  );

  useEffect(() => {
    if (isGuest && !GUEST_HOME_TABS.includes(activeTab)) {
      setActiveTab('Upcoming');
    }
  }, [isGuest, activeTab]);

  const displayName = pickDisplayName(user) || 'My profile';
  const location = pickLocationLabel(user) || 'Your location';
  const interestLabels = useMemo(
    () => normalizeInterestLabels((user as { interests?: unknown } | null)?.interests),
    [user],
  );
  const upcomingEvents = useMemo(
    () => sortByStartsSoonest(events.filter((event) => !isPastEvent(event))),
    [events],
  );
  const pastEvents = useMemo(() => events.filter((event) => isPastEvent(event)), [events]);
  const joinedUpcomingEvents = useMemo(
    () => upcomingEvents.filter((event: any) => Boolean(event.isJoined)),
    [upcomingEvents],
  );
  const upcomingNotJoinedEvents = useMemo(
    () => upcomingEvents.filter((event: any) => !event.isJoined),
    [upcomingEvents],
  );
  const savedEvents = useMemo(
    () => events.filter((event) => savedEventIds.includes(event.id)),
    [events, savedEventIds],
  );
  const activeData = useMemo(() => {
    if (isGuest) return [];

    switch (activeTab) {
      case 'Past':
        return pastEvents;
      case 'Joined':
        return joinedUpcomingEvents;
      case 'Saved':
        return savedEvents;
      case 'Upcoming':
      default:
        return upcomingNotJoinedEvents.length ? upcomingNotJoinedEvents : upcomingEvents;
    }
  }, [
    activeTab,
    isGuest,
    pastEvents,
    joinedUpcomingEvents,
    savedEvents,
    upcomingNotJoinedEvents,
    upcomingEvents,
  ]);

  const trendingEvents = useMemo(() => {
    const eligible = upcomingEvents.filter((event) => getEventGoingCount(event) >= TRENDING_MIN_ATTENDEES);
    return rankEventsByScore(eligible, scoreTrendingEvent).slice(0, 6);
  }, [upcomingEvents]);
  const trendingHeroEvent = trendingEvents[0] ?? null;
  const discoverMoreEvents = useMemo(() => {
    const usedIds = new Set<string>();
    for (const event of activeData) usedIds.add(eventId(event));
    for (const event of recommendedEvents.slice(0, 2)) usedIds.add(eventId(event));
    if (trendingHeroEvent) usedIds.add(eventId(trendingHeroEvent));

    return sortByNewestFirst(
      upcomingEvents.filter((event) => !usedIds.has(eventId(event))),
    ).slice(0, 8);
  }, [activeData, recommendedEvents, trendingHeroEvent, upcomingEvents]);
  const insightSections = useMemo<HomeInsightSection[]>(
    () => [
      {
        id: 'discover',
        title: 'Discover More',
        subtitle: 'Newest upcoming events not shown above',
        items: discoverMoreEvents,
      },
    ],
    [discoverMoreEvents],
  );

  if (isLoading) {
    return (
      <Container>
        <SafeAreaView style={[styles.flex, styles.screenTopInset]} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <HomeSkeleton />
        </SafeAreaView>
      </Container>
    );
  }

  return (
    <Container>
      <SafeAreaView style={[styles.flex, styles.screenTopInset]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <FlatList
          data={[]}
          keyExtractor={(_, index) => `home-${index}`}
          renderItem={() => null}
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
              <HomeHeader displayName={displayName} isGuest={isGuest} />
              {isGuest ? (
                <GuestUpcomingSection
                  events={upcomingEvents}
                  cardWidth={guestEventCardWidth}
                  onSeeAll={() => router.push('/(tabs)/explore')}
                />
              ) : (
                <>
                  <YourEventsSection
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isGuest={isGuest}
                  />
                  {activeData.length ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.myEventsRow}
                      nestedScrollEnabled
                      decelerationRate="fast"
                      snapToInterval={myEventCardWidth + spacing.sm}
                      snapToAlignment="start"
                      disableIntervalMomentum
                    >
                      {activeData.map((event) => (
                        <HomeMyEventCard
                          key={`active-${event.id}`}
                          event={event}
                          activeTab={activeTab}
                          cardWidth={myEventCardWidth}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={[styles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Image source={NO_EVENTS_IMAGE} style={styles.emptyIllustration} resizeMode="contain" />
                      <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        {activeTab === 'Upcoming' ? 'No upcoming events' : `No ${activeTab.toLowerCase()} events`}
                      </Text>
                      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                        {activeTab === 'Upcoming'
                          ? 'Discover events happening near you.'
                          : "You don't have any events right now. Let's find some!"}
                      </Text>
                      <TouchableOpacity
                        style={[styles.emptyCta, { backgroundColor: colors.primary }]}
                        activeOpacity={0.9}
                        onPress={() => router.push('/(tabs)/explore')}
                      >
                        <Text style={styles.emptyCtaText}>Explore Events</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </>
          }
          ListEmptyComponent={loadError ? <EmptyState title="Could not load events" message={loadError} icon="alert-circle" /> : null}
          ItemSeparatorComponent={() => <View style={styles.feedSeparator} />}
          ListFooterComponent={
            !loadError ? (
              <>
                {!isGuest && recommendedEvents.length > 0 ? (
                  <View style={styles.recommendedSection}>
                    <View style={styles.recommendedHead}>
                      <Text style={[styles.recommendedTitle, { color: colors.text }]}>Recommended For You</Text>
                      {recommendedEvents.length > 2 ? (
                        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(tabs)/explore')}>
                          <Text style={[styles.recommendedSeeAll, { color: colors.primary }]}>See all</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={styles.recommendedList}>
                      {recommendedEvents.slice(0, 2).map((event) => (
                        <RecommendedMiniCard key={`rec-${event.id}`} event={event} />
                      ))}
                    </View>
                  </View>
                ) : null}
                {trendingHeroEvent ? (
                  <View style={styles.popularSection}>
                    <View style={styles.popularSectionHead}>
                      <Text style={[styles.popularSectionTitle, { color: colors.text }]}>Trending Now</Text>
                    </View>
                    <TrendingHeroCard event={trendingHeroEvent} />
                  </View>
                ) : null}
                {!isGuest ? <HomeInsightSections sections={insightSections} /> : null}
              </>
            ) : null
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
  screenTopInset: {
    paddingTop: SCREEN_TOP_EXTRA,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl + 16,
  },
  feedSeparator: {
    height: 8,
  },
  myEventsRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  guestUpcomingSection: {
    paddingBottom: spacing.xs,
  },
  guestUpcomingHead: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  guestUpcomingTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  guestUpcomingSeeAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  myEventCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  myEventImageWrap: {
    width: '100%',
    height: 176,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative',
  },
  myEventImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myEventFallbackLetter: {
    fontSize: 34,
    fontWeight: '700',
  },
  myEventHeroTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    gap: 6,
    alignItems: 'flex-start',
  },
  myEventPriceBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myEventPriceBadgeText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    color: '#FF7B3F',
  },
  myEventJoinedBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(240,253,244,0.95)',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myEventBadgeText: {
    color: '#15803D',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  myEventStatusBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF7B3F',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 2,
  },
  myEventStatusBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coverHeroActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  coverHeroActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverHeroActionBtnGlass: {
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  coverHeroActionBtnSaved: {
    backgroundColor: '#FF7B3F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  myEventBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  myEventTitle: {
    fontSize: 36 / 2,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  myEventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myEventMetaText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
  },
  myEventFooter: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  myEventAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myEventAvatarOverlap: {
    marginLeft: -8,
  },
  myEventGoingText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  recommendedSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  recommendedHead: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recommendedTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  recommendedSeeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendedList: {
    gap: 12,
  },
  recommendedEmptyWrap: {
    minHeight: 62,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedEmptyText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  recommendedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendedLeftCol: {
    width: 145,
    flexShrink: 0,
  },
  recommendedImageWrap: {
    width: 145,
    height: 95,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  coverBannerFill: {
    width: '100%',
    height: '100%',
  },
  recommendedActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  recommendedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  recommendedActionText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  recommendedRightCol: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
    gap: 6,
  },
  recommendedCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEFE5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recommendedCategoryText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#FF7B3F',
  },
  recommendedCardTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  recommendedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendedMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  spotlightWrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    shadowColor: '#BE123C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 6,
  },
  spotlightGlowOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 30,
    backgroundColor: 'rgba(37,99,235,0.2)',
    right: -36,
    top: -28,
    transform: [{ rotate: '-12deg' }],
  },
  spotlightGlowTwo: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    left: -30,
    bottom: -26,
    transform: [{ rotate: '12deg' }],
  },
  spotlightTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  spotlightCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  spotlightKicker: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  spotlightTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.25,
  },
  spotlightSubtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  spotlightMetricsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  spotlightMetricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  spotlightMetricValue: {
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  spotlightMetricLabel: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  spotlightCta: {
    marginTop: spacing.md,
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  spotlightCtaText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  emptyWrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIllustration: {
    width: 132,
    height: 132,
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyCta: {
    minHeight: 38,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  insightsWrap: {
    marginTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  insightSection: {
    marginBottom: spacing.lg,
  },
  insightSectionHead: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: 6,
  },
  insightSectionKicker: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightSectionKickerText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  insightSectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  insightSectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  insightRowContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  insightCard: {
    width: 264,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  insightCover: {
    width: '100%',
    height: 134,
    backgroundColor: '#F2F4F7',
    overflow: 'hidden',
    position: 'relative',
  },
  insightCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.14)',
  },
  insightCategoryPill: {
    position: 'absolute',
    left: 10,
    bottom: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  insightCategoryText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: '#BE123C',
    letterSpacing: 0.2,
  },
  insightCoverFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCoverLetter: {
    fontSize: 30,
    fontWeight: '700',
  },
  insightBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  insightTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    minHeight: 40,
  },
  insightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  insightMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  popularSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  popularSectionHead: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: 2,
  },
  popularSectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  popularSectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  popularHeroCard: {
    marginHorizontal: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
    position: 'relative',
  },
  popularHeroImageWrap: {
    width: '100%',
    height: 182,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  popularHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  popularHeroContent: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 14,
    bottom: 14,
    justifyContent: 'space-between',
  },
  popularMostAttendedChip: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularMostAttendedText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  popularHeroCopy: {
    paddingRight: 96,
    gap: 6,
  },
  popularHeroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  popularHeroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  popularHeroFooter: {
    gap: 12,
  },
  popularAttendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  popularAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularAvatarOverlap: {
    marginLeft: -10,
  },
  popularAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  popularAttendingText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  popularCtaPill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popularCtaText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
});

export default HomeScreen;
