import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import VerificationBadgeWhite from '@/assets/verification badge white mode.svg';
import { ExploreEventCard } from '@/components/explore/ExploreEventCard';
import {
  OrganizerAvatar,
  OrganizerInfoRow,
  StatTile,
  formatCount,
  formatRating,
} from '@/components/organizer/OrganizerProfileChrome';
import { spacing } from '@/theme';
import { COLORS } from '@/theme/colors';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

const ROLE_MEMBER = 1;

function formatOrganizerEventDateTime(event) {
  const startDate = new Date(event.startsAt ?? Date.now());
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

function resolveOrganizerEventCoverUrl(event) {
  const rawImage = [
    event?.coverImageUrl,
    event?.coverImage,
    event?.cover_image,
    event?.cover?.url,
    event?.cover?.path,
    typeof event?.image === 'string' ? event.image : event?.image?.uri,
  ].find((candidate) => typeof candidate === 'string' && candidate.trim());

  if (!rawImage) return null;
  const normalizedImage = rawImage.trim().replace(/\\/g, '/');
  return resolveApiAssetUrl(normalizedImage) || normalizedImage;
}

function toExploreCardEvent(event) {
  const isOnline = Boolean(event.isOnline);
  return {
    id: String(event.id),
    title: event.title,
    dateTimeLabel: formatOrganizerEventDateTime(event),
    location: isOnline ? 'Online' : event.city || event.locationName || 'Venue TBD',
    coverImageUrl: resolveOrganizerEventCoverUrl(event),
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

export default function PublicOrganizerProfileScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const organizerId = Number(Array.isArray(id) ? id[0] : id);
  const { isLoggedIn, isMember, userRole } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventItems, setEventItems] = useState([]);
  const [mainTab, setMainTab] = useState('events');
  const [eventScope, setEventScope] = useState('upcoming');
  const [followBusy, setFollowBusy] = useState(false);

  const loadProfile = useCallback(async () => {
    const data = await organizerApi.getPublicOrganizerProfile(organizerId);
    setProfile(data);
  }, [organizerId]);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const { items } = await organizerApi.getPublicOrganizerEvents(organizerId, eventScope);
      setEventItems(items || []);
    } catch {
      setEventItems([]);
    } finally {
      setEventsLoading(false);
    }
  }, [organizerId, eventScope]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!Number.isFinite(organizerId) || organizerId <= 0) {
        setLoading(false);
        return;
      }
      try {
        if (mounted) setLoading(true);
        await loadProfile();
      } catch {
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [organizerId, loadProfile]);

  useEffect(() => {
    if (mainTab !== 'events' || !profile) return;
    loadEvents();
  }, [mainTab, eventScope, profile, loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfile();
      if (mainTab === 'events') await loadEvents();
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile, loadEvents, mainTab]);

  const stats = useMemo(
    () => [
      { key: 'events', label: 'Events', value: formatCount(profile?.eventsCount) },
      { key: 'followers', label: 'Followers', value: formatCount(profile?.followersCount) },
      { key: 'rating', label: 'Rating', value: formatRating(profile?.ratingAverage) },
    ],
    [profile?.eventsCount, profile?.followersCount, profile?.ratingAverage],
  );

  const displayName = profile?.displayName || profile?.organizationName || profile?.fullName || 'Organizer';
  const avatarUri = resolveApiAssetUrl(profile?.profileImg);
  const isVerified = profile?.verificationStatus === 'approved';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${displayName} on MadalHub`,
      });
    } catch {
      /* ignore */
    }
  };

  const handleFollowPress = async () => {
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }
    if (userRole !== ROLE_MEMBER || !isMember) {
      Alert.alert('Members only', 'Switch to a member account to follow organizers.');
      return;
    }
    if (!profile) return;
    setFollowBusy(true);
    try {
      if (profile.isFollowing) {
        await organizerApi.unfollowOrganizer(organizerId);
        setProfile((p) => (p ? { ...p, isFollowing: false } : p));
      } else {
        await organizerApi.followOrganizer(organizerId);
        setProfile((p) => (p ? { ...p, isFollowing: true } : p));
      }
    } catch (e) {
      Alert.alert('Could not update', e?.message || 'Try again.');
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = () => {
    Alert.alert('Coming soon', 'Messaging organizers will be available in a future update.');
  };

  if (!Number.isFinite(organizerId) || organizerId <= 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: COLORS.textSecondary }}>Invalid organizer.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>Organizer not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const followLabel = profile.isFollowing ? 'Following' : 'Follow';

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{
          paddingTop: insets.top + 6,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text
            allowFontScaling={false}
            style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' }}
          >
            Organizer Profile
          </Text>
          <Pressable onPress={handleShare} hitSlop={12} style={{ padding: 4 }}>
            <Feather name="share" size={22} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <OrganizerAvatar uri={avatarUri} name={displayName} />
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' }}>
              {displayName}
            </Text>
            {isVerified ? <VerificationBadgeWhite width={16} height={16} style={{ marginLeft: 8 }} /> : null}
          </View>
          {profile.location ? (
            <Text allowFontScaling={false} style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4 }}>
              {profile.location}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', marginTop: 18, marginBottom: 16 }}>
          {stats.map((s) => (
            <View key={s.key} style={{ flex: 1 }}>
              <StatTile label={s.label} value={s.value} />
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <Pressable
            onPress={handleFollowPress}
            disabled={followBusy}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              borderRadius: 14,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: followBusy ? 0.65 : pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: COLORS.card, fontWeight: '800', fontSize: 15 }}>
              {followBusy ? '…' : followLabel}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleMessage}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: COLORS.primary,
              backgroundColor: COLORS.card,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Text style={{ color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 }}>Message</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 14 }}>
          <Pressable onPress={() => setMainTab('events')} style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: mainTab === 'events' ? '800' : '600',
                color: mainTab === 'events' ? COLORS.textPrimary : COLORS.textMuted,
              }}
            >
              Events
            </Text>
            {mainTab === 'events' ? (
              <View style={{ height: 3, backgroundColor: COLORS.primary, borderRadius: 2, marginTop: 8, width: '40%' }} />
            ) : (
              <View style={{ height: 3, marginTop: 8 }} />
            )}
          </Pressable>
          <Pressable onPress={() => setMainTab('about')} style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: mainTab === 'about' ? '800' : '600',
                color: mainTab === 'about' ? COLORS.textPrimary : COLORS.textMuted,
              }}
            >
              About
            </Text>
            {mainTab === 'about' ? (
              <View style={{ height: 3, backgroundColor: COLORS.primary, borderRadius: 2, marginTop: 8, width: '40%' }} />
            ) : (
              <View style={{ height: 3, marginTop: 8 }} />
            )}
          </Pressable>
        </View>

        {mainTab === 'events' ? (
          <><View style={{ flexDirection: 'row', borderRadius: 14, backgroundColor: '#EEF0F4', padding: 3, height: 40, marginBottom: 12 }}>
              <Pressable
                onPress={() => setEventScope('upcoming')}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRadius: 11,
                  height: 34,
                  backgroundColor: eventScope === 'upcoming' ? COLORS.primary : 'transparent',
                  shadowColor: eventScope === 'upcoming' ? '#C2410C' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: eventScope === 'upcoming' ? 0.2 : 0,
                  shadowRadius: eventScope === 'upcoming' ? 2 : 0,
                  elevation: eventScope === 'upcoming' ? 2 : 0,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Feather name="calendar" size={14} color={eventScope === 'upcoming' ? '#fff' : COLORS.textSecondary} />
                <Text style={{ color: eventScope === 'upcoming' ? '#fff' : COLORS.textSecondary, fontWeight: '700', fontSize: 13 }}>
                  Upcoming
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setEventScope('past')}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRadius: 11,
                  height: 34,
                  backgroundColor: eventScope === 'past' ? COLORS.primary : 'transparent',
                  shadowColor: eventScope === 'past' ? '#C2410C' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: eventScope === 'past' ? 0.2 : 0,
                  shadowRadius: eventScope === 'past' ? 2 : 0,
                  elevation: eventScope === 'past' ? 2 : 0,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Feather name="clock" size={14} color={eventScope === 'past' ? '#fff' : COLORS.textSecondary} />
                <Text style={{ color: eventScope === 'past' ? '#fff' : COLORS.textSecondary, fontWeight: '700', fontSize: 13 }}>
                  Past
                </Text>
              </Pressable>
            </View>
            {eventsLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
            ) : eventItems.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginVertical: 24 }}>
                No {eventScope === 'upcoming' ? 'upcoming' : 'past'} events yet.
              </Text>
            ) : (
              eventItems.map((ev) => (
                <ExploreEventCard key={ev.id} event={toExploreCardEvent(ev)} />
              ))
            )}
          </>
        ) : (
          <View style={{ marginBottom: 16 }}>
            <Text allowFontScaling={false} style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 12 }}>
              {profile.organizationDescription || 'This organizer has not added a description yet.'}
            </Text>
            <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 8 }} />
            <OrganizerInfoRow skipEmpty icon="globe" label="WEBSITE" value={profile.website || ''} />
            <OrganizerInfoRow skipEmpty icon="map-pin" label="LOCATION" value={profile.location || ''} />
            <Pressable
              onPress={handleMessage}
              style={({ pressed }) => ({
                marginTop: 20,
                minHeight: 48,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: COLORS.textPrimary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.textPrimary }}>Contact organizer</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
