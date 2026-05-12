import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { useThemeColors } from '@/theme';
import KulanLogo from '@/assets/kulan_logo.svg';
import NoEventsIllustration from '@/assets/no events.svg';
import VerificationBadgeWhite from '@/assets/verification badge white mode.svg';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import OrganizerDashboardSkeleton from '@/components/skeletons/OrganizerDashboardSkeleton';
import { Alert, StyleSheet } from 'react-native';

function initials(name) {
  if (!name || typeof name !== 'string') return 'O';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatDateTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatEventMeta(event) {
  const online = event?.isPhysical ? 'In-person' : 'Online';
  const price = Number(event?.totalPrice) > 0 ? `$${event.totalPrice}` : 'Free';
  return `${online} • ${price}`;
}

function resolveOrganizerEventCoverUrl(event) {
  const raw =
    event?.coverImage ??
    event?.image ??
    event?.coverImageUrl ??
    event?.cover_image ??
    event?.cover?.url ??
    event?.cover?.path ??
    event?.image?.uri ??
    null;

  if (typeof raw !== 'string' || !raw.trim()) return null;
  return resolveApiAssetUrl(raw.trim().replace(/\\/g, '/')) || raw.trim();
}

function statusChip(event) {
  if (event?.status === 'draft') return { label: 'Draft', bg: '#EEF2FF', fg: '#4F46E5' };
  
  const start = event?.startsAt ? new Date(event.startsAt).getTime() : null;
  const end = event?.endsAt ? new Date(event.endsAt).getTime() : null;
  const now = Date.now();
  
  if (end && now > end) {
    return { label: 'Past', bg: '#F3F4F6', fg: '#374151' };
  } else if (!end && start && now > start + 86400000) {
    // If no explicit end time is set, assume past if it's 24h past the start time
    return { label: 'Past', bg: '#F3F4F6', fg: '#374151' };
  }

  if (start && start > now) {
    const ms = start - now;
    const days = Math.ceil(ms / 86400000);
    return { label: days <= 2 ? `In ${days} day${days > 1 ? 's' : ''}` : 'Upcoming', bg: '#FFEDE3', fg: '#FF7B3F' };
  }
  return { label: 'Live', bg: '#E8F6EE', fg: '#0D9A58' };
}

export default function OrganizerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  const [headerProfileImg, setHeaderProfileImg] = useState('');
  const [headerFullName, setHeaderFullName] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const pulse = useState(() => new Animated.Value(0))[0];
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const [eventsData, profileData] = await Promise.all([
        organizerApi.getOrganizerEvents(),
        organizerApi.getProfileDashboard().catch(() => null),
      ]);
      setEvents(eventsData);
      setOrganizationName((profileData?.organizationName ?? '').trim());
      setHeaderFullName((profileData?.fullName ?? '').trim());
      setHeaderProfileImg(resolveApiAssetUrl(profileData?.profileImg) || '');
      setVerificationStatus((profileData?.verificationStatus ?? '').trim().toLowerCase());
    } catch (error) {
      console.error('Failed to fetch organizer events:', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchEvents();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchEvents]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: 850,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: 850,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const openDeleteModal = useCallback((event) => {
    setDeleteTarget({
      id: event.id,
      title: typeof event.title === 'string' && event.title.trim() ? event.title.trim() : 'Untitled event',
    });
    setDeleteModalVisible(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (deleteSubmitting) return;
    setDeleteModalVisible(false);
    setDeleteTarget(null);
  }, [deleteSubmitting]);

  const confirmDeleteEvent = useCallback(async () => {
    if (!deleteTarget?.id) return;
    setDeleteSubmitting(true);
    try {
      await organizerApi.deleteEvent(deleteTarget.id);
      await fetchEvents();
      setDeleteModalVisible(false);
      setDeleteTarget(null);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to delete event');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, fetchEvents]);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        if (a.status === 'draft' && b.status !== 'draft') return 1;
        if (a.status !== 'draft' && b.status === 'draft') return -1;
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      }),
    [events],
  );

  const totalAttendees = useMemo(
    () => events.reduce((sum, event) => sum + Number(event.registrationCount ?? 0), 0),
    [events],
  );
  const upcomingCount = useMemo(
    () =>
      events.filter(
        (event) => event.status === 'published' && new Date(event.startsAt).getTime() > Date.now(),
      ).length,
    [events],
  );
  const draftCount = useMemo(() => events.filter((event) => event.status === 'draft').length, [events]);
  const publishedCount = useMemo(
    () => events.filter((event) => event.status === 'published').length,
    [events],
  );
  const nearestUpcomingEvent = useMemo(
    () =>
      events
        .filter(
          (event) =>
            event.status === 'published' && new Date(event.startsAt).getTime() > Date.now(),
        )
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] ?? null,
    [events],
  );

  const metricCards = [
    {
      key: 'total',
      label: 'Total events',
      value: events.length,
      hint: `${events.length === 1 ? '1 event created' : `${events.length} events created`}`,
      icon: 'calendar-outline',
      accent: '#FF7A00',
      bg: '#FFF7ED',
    },
    {
      key: 'attendees',
      label: 'Attendees',
      value: totalAttendees,
      hint:
        totalAttendees === 0
          ? 'No attendees yet'
          : `${totalAttendees} total registrations`,
      icon: 'people-outline',
      accent: '#2563EB',
      bg: '#EFF6FF',
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      value: upcomingCount,
      hint: nearestUpcomingEvent
        ? `Next: ${formatDate(nearestUpcomingEvent.startsAt)}`
        : 'No upcoming events',
      icon: 'time-outline',
      accent: '#059669',
      bg: '#ECFDF5',
    },
    {
      key: 'drafts',
      label: 'Drafts',
      value: draftCount,
      hint: draftCount > 0 ? 'Ready to publish' : 'No drafts pending',
      icon: 'document-text-outline',
      accent: '#7C3AED',
      bg: '#F5F3FF',
    },
  ];

  const hasEvents = sortedEvents.length > 0;
  const greetingName =
    organizationName || headerFullName || user?.organizationName || user?.fullName || 'Organizer';
  const headerInitials = initials(organizationName || headerFullName || user?.fullName);
  const isVerifiedOrganizer = verificationStatus === 'approved';
  const headerSubtitle = loading
    ? 'Loading your dashboard...'
    : hasEvents
      ? nearestUpcomingEvent
        ? `Next event: ${formatDateTime(nearestUpcomingEvent.startsAt)}`
        : 'Manage your events and keep your audience engaged'
      : 'Start by creating your first event';
  const nextActionTitle = nearestUpcomingEvent?.title || (hasEvents ? 'Keep your calendar active' : 'Create your first event');
  const nextActionSubtitle = nearestUpcomingEvent
    ? formatDateTime(nearestUpcomingEvent.startsAt)
    : hasEvents
      ? 'Create another event or continue improving your drafts.'
      : 'Build, publish, and manage events from one place.';
  const pulseStyle = {
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        }),
      },
    ],
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    }),
  };

  const displayEvents = useMemo(() => {
    if (activeTab === 'All') return sortedEvents;
    if (activeTab === 'Drafts') return sortedEvents.filter(e => e.status === 'draft');
    if (activeTab === 'Published') {
      return sortedEvents.filter(e => {
        if (e.status !== 'published') return false;
        const end = e.endsAt ? new Date(e.endsAt).getTime() : null;
        const start = e.startsAt ? new Date(e.startsAt).getTime() : null;
        const now = Date.now();
        if (end && now > end) return false;
        if (!end && start && now > start + 86400000) return false;
        return true;
      });
    }
    if (activeTab === 'Past') {
      return sortedEvents.filter(e => {
        const end = e.endsAt ? new Date(e.endsAt).getTime() : null;
        const start = e.startsAt ? new Date(e.startsAt).getTime() : null;
        const now = Date.now();
        if (end && now > end) return true;
        if (!end && start && now > start + 86400000) return true;
        return false;
      });
    }
    return sortedEvents;
  }, [sortedEvents, activeTab]);

  if (loading) {
    return <OrganizerDashboardSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F8' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <LinearGradient
          colors={['#FFF7ED', '#FFFFFF', '#EEF2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 28,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: '#FFE1CC',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 5,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <KulanLogo width={128} height={38} preserveAspectRatio="xMidYMid meet" />
          </View>

          <Pressable
            onPress={() => router.push('/(organizer)/profile')}
            style={({ pressed }) => ({
              marginTop: 14,
              borderRadius: 20,
              backgroundColor: pressed ? '#F8FAFC' : '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              paddingVertical: 12,
              paddingLeft: 12,
              paddingRight: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.07,
              shadowRadius: 16,
              elevation: 3,
            })}
            accessibilityRole="button"
            accessibilityLabel="Open organizer profile"
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: '#FFFFFF',
                backgroundColor: '#FFE9DD',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {headerProfileImg ? (
                <Image source={{ uri: headerProfileImg }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900' }}>{headerInitials}</Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
                <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '900', flexShrink: 1 }} numberOfLines={1}>
                  {greetingName}
                </Text>
                {isVerifiedOrganizer ? <VerificationBadgeWhite width={16} height={16} style={{ marginLeft: 7 }} /> : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                  Organizer profile
                </Text>
              </View>
            </View>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </View>
          </Pressable>

          <Text style={{ marginTop: 16, color: '#0F172A', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
            Good morning, {greetingName}
          </Text>
          <Text style={{ marginTop: 6, color: '#64748B', fontSize: 14, lineHeight: 20, maxWidth: 290 }}>
            {headerSubtitle}
          </Text>

          <View
            style={{
              marginTop: 16,
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.84)',
              borderWidth: 1,
              borderColor: '#FFFFFF',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={nearestUpcomingEvent ? 'calendar' : 'sparkles'} size={15} color={colors.primary} />
                </View>
                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {nearestUpcomingEvent ? 'Next event' : 'Start here'}
                </Text>
              </View>
              <Text style={{ marginTop: 8, color: '#111827', fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
                {nextActionTitle}
              </Text>
              <Text style={{ marginTop: 3, color: '#64748B', fontSize: 12 }}>
                {nextActionSubtitle}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 6 }}>
          {metricCards.map((card) => (
            <View
              key={card.key}
              style={{
                width: '50%',
                paddingHorizontal: 5,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  minHeight: 112,
                  backgroundColor: 'white',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: '#EEF2F7',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.04,
                  shadowRadius: 16,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text
                    style={{
                      fontSize: 10,
                      color: '#8D8D93',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                    }}
                  >
                    {card.label}
                  </Text>
                  <View style={{ width: 30, height: 30, borderRadius: 12, backgroundColor: card.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={card.icon} size={16} color={card.accent} />
                  </View>
                </View>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#17171B', marginTop: 10, letterSpacing: -0.8 }}>
                  {card.value}
                </Text>
                <Text style={{ fontSize: 11, color: '#8D8D93', marginTop: 3, lineHeight: 15 }}>{card.hint}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/(organizer)/create-event')}
          style={({ pressed }) => ({
            marginTop: 0,
            marginBottom: 18,
            minHeight: 76,
            borderRadius: 26,
            backgroundColor: pressed ? '#FFEDD5' : '#FFF7ED',
            borderWidth: 1,
            borderColor: '#FED7AA',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
            paddingHorizontal: 18,
            shadowColor: colors.primary,
            shadowOpacity: 0.14,
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 22,
            elevation: 6,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 48, height: 48, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sparkles" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '900', color: '#9A3412', fontSize: 17, letterSpacing: -0.2 }}>Create new event</Text>
              <Text style={{ color: '#B45309', fontSize: 12, marginTop: 3 }}>Add cover, venue, speakers and sponsors.</Text>
            </View>
          </View>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FED7AA' }}>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </View>
        </Pressable>

        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            <View>
              <Text style={{ color: '#0F172A', fontSize: 20, fontWeight: '900', letterSpacing: -0.4 }}>Your events</Text>
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{displayEvents.length} showing in {activeTab.toLowerCase()}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
            {['All', 'Drafts', 'Published', 'Past'].map((tab) => {
              const isActive = activeTab === tab;
              const iconName = 
                tab === 'All' ? 'list-outline' :
                tab === 'Drafts' ? 'document-text-outline' :
                tab === 'Published' ? 'globe-outline' : 'time-outline';
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: isActive ? colors.primary : '#F0F0F2',
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : '#E7E7EA',
                    gap: 6
                  }}
                >
                  <Ionicons name={iconName} size={15} color={isActive ? '#fff' : '#6E6E75'} />
                  <Text style={{ color: isActive ? '#fff' : '#6E6E75', fontSize: 13, fontWeight: '700' }}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {!hasEvents ? (
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#E7E7EA',
              paddingHorizontal: 18,
              paddingTop: 24,
              paddingBottom: 24,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 360,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 14,
              elevation: 2,
            }}
          >
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={{ color: '#101324', fontSize: 28, fontWeight: '800' }}>No events yet</Text>
              <Text style={{ color: '#6E7380', fontSize: 14, lineHeight: 22, marginTop: 8 }}>
                Create your first event and start bringing people together.
              </Text>
            </View>
            <NoEventsIllustration width={328} height={236} />
            <Animated.View
              style={{
                marginTop: 12,
                width: '100%',
                alignItems: 'flex-end',
                paddingRight: 2,
                paddingBottom: 4,
              }}
            >
              <Animated.View style={pulseStyle}>
                <Pressable
                  onPress={() => router.push('/(organizer)/create-event')}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: colors.primary,
                    shadowOpacity: 0.3,
                    shadowOffset: { width: 0, height: 5 },
                    shadowRadius: 10,
                    elevation: 5,
                  }}
                  accessibilityLabel="Create your first event"
                >
                  <Ionicons name="add" size={30} color="#fff" />
                </Pressable>
              </Animated.View>
            </Animated.View>
          </View>
        ) : displayEvents.length === 0 ? (
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#E7E7EA',
              paddingHorizontal: 18,
              paddingTop: 24,
              paddingBottom: 24,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 340,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.05,
              shadowRadius: 16,
              elevation: 2,
            }}
          >
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={{ color: '#101324', fontSize: 20, fontWeight: '800' }}>No {activeTab.toLowerCase()} events</Text>
              <Text style={{ color: '#6E7380', fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' }}>
                {activeTab === 'All' && "Create your first event and start bringing people together."}
                {activeTab === 'Drafts' && "You don't have any saved drafts."}
                {activeTab === 'Published' && "You don't have any active published events."}
                {activeTab === 'Past' && "You don't have any past events."}
              </Text>
            </View>
            <NoEventsIllustration width={286} height={206} />
          </View>
        ) : (
          displayEvents.map((event) => {
            const chip = statusChip(event);
            const startDateLabel = formatDate(event.startsAt);
            let startTimeLabel = '';
            if (event.startsAt) {
              const d = new Date(event.startsAt);
              if (!isNaN(d.getTime())) {
                startTimeLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              }
            }
            const attendees = Number(event.registrationCount ?? 0);
            const capacity = Number(event.capacity ?? 0);
            const coverUrl = resolveOrganizerEventCoverUrl(event);
            const priceLabel = Number(event.totalPrice) > 0 ? `$${event.totalPrice}` : 'Free';
            const locationKind = event.isPhysical ? 'IN-PERSON' : 'ONLINE';
            const showProgressBar = capacity > 0;
            const isEnded = chip.label === 'Past';
            const terminalBadgeSource = require('../../src/assets/ended.png');

            return (
              <View
                key={event.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: '#EEF2F7',
                  marginBottom: 16,
                  overflow: 'hidden',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.07,
                  shadowRadius: 22,
                  elevation: 4,
                }}
              >
                {/* Image Header */}
                <View style={{ height: 168, width: '100%', backgroundColor: '#F8FAFC', position: 'relative' }}>
                  {coverUrl ? (
                    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <Image 
                        source={{ uri: coverUrl }} 
                        style={{ width: '100%', height: '100%' }} 
                        resizeMode="cover" 
                        blurRadius={isEnded ? 11 : 0}
                      />
                      {isEnded && (
                        <View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.72)' }]} />
                      )}
                      {isEnded && (
                        <Image
                          source={{ uri: coverUrl }}
                          style={[{ ...StyleSheet.absoluteFillObject, opacity: 0.4 }]}
                          resizeMode="contain"
                          blurRadius={7}
                        />
                      )}
                      {isEnded && (
                        <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }}>
                          <Image source={terminalBadgeSource} style={{ width: 140, height: 140 }} resizeMode="contain" />
                        </View>
                      )}
                      {!isEnded && (
                        <LinearGradient
                          colors={['rgba(15,23,42,0.02)', 'rgba(15,23,42,0.42)']}
                          locations={[0.35, 1]}
                          style={StyleSheet.absoluteFillObject}
                        />
                      )}
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['#FFF7ED', '#EEF2FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.78)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF' }}>
                        <Ionicons name="image-outline" size={30} color="#EA580C" />
                      </View>
                      {isEnded && (
                        <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)' }}>
                          <Image source={terminalBadgeSource} style={{ width: 140, height: 140 }} resizeMode="contain" />
                        </View>
                      )}
                    </LinearGradient>
                  )}
                  {/* Status Overlay */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      backgroundColor: isEnded ? chip.bg : 'rgba(255,255,255,0.92)',
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    <Ionicons name={event.status === 'draft' ? "document-text" : "radio-button-on"} size={12} color={chip.fg} />
                    <Text style={{ color: chip.fg, fontSize: 11, fontWeight: '800' }}>{chip.label}</Text>
                  </View>
                </View>

                {/* Body Content */}
                <View style={{ padding: 16 }}>
                  {/* Tags Row */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Ionicons name={locationKind === 'ONLINE' ? 'videocam-outline' : 'location-outline'} size={12} color="#475569" />
                      <Text style={{ color: '#475569', fontSize: 11, fontWeight: '800' }}>{locationKind}</Text>
                    </View>
                    <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#BBF7D0' }}>
                      <Ionicons name={priceLabel === 'Free' ? 'cash-outline' : 'card-outline'} size={12} color="#166534" />
                      <Text style={{ color: '#166534', fontSize: 11, fontWeight: '800' }}>{priceLabel}</Text>
                    </View>
                  </View>

                  <Text style={{ color: '#0F172A', fontSize: 19, fontWeight: '900', marginBottom: 14, letterSpacing: -0.3 }} numberOfLines={2}>
                    {event.title}
                  </Text>

                  {/* Details Block */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EEF2F7', padding: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                        <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Date</Text>
                      </View>
                      <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '800', marginTop: 5 }}>{startDateLabel || 'Not set'}</Text>
                    </View>
                    <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EEF2F7', padding: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="time-outline" size={14} color="#64748B" />
                        <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Time</Text>
                      </View>
                      <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '800', marginTop: 5 }}>{startTimeLabel || 'Not set'}</Text>
                    </View>
                  </View>

                  {/* Attendees Insight */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: showProgressBar ? 10 : 16 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="people" size={14} color="#4F46E5" />
                    </View>
                    <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '700' }}>
                      {attendees} going <Text style={{ color: '#64748B', fontWeight: '400' }}>{capacity > 0 ? `(of ${capacity} capacity)` : ''}</Text>
                    </Text>
                  </View>

                  {showProgressBar && (
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                        <View
                          style={{
                            width: `${Math.max(4, Math.min(100, (attendees / capacity) * 100))}%`,
                            height: '100%',
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/(organizer)/edit-event', params: { eventId: event.id } })}
                      style={{
                        flex: 1,
                        borderRadius: 13,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        height: 42,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F8FAFC',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color="#0F172A" />
                      <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '700' }}>
                        {event.status === 'draft' ? 'Edit Draft' : 'Edit Event'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push(`/events/${event.id}`)}
                      style={{
                        flex: 1,
                        borderRadius: 13,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        height: 42,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fff',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#0F172A" />
                      <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '700' }}>View Details</Text>
                    </Pressable>
                  </View>

                  {event.status === 'draft' && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <Pressable
                        onPress={async () => {
                          try {
                            await organizerApi.publishEvent(event.id);
                            await fetchEvents();
                          } catch (error) {
                            console.error('Publish event failed:', error);
                          }
                        }}
                        style={{
                          flex: 1,
                          borderRadius: 13,
                          backgroundColor: colors.primary,
                          height: 42,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          gap: 6
                        }}
                      >
                        <Ionicons name="rocket-outline" size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Publish Event</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => openDeleteModal(event)}
                        style={{
                          width: 38,
                          borderRadius: 13,
                          backgroundColor: '#FEF2F2',
                          borderWidth: 1,
                          borderColor: '#FECACA',
                          height: 42,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      </Pressable>
                    </View>
                  )}

                  {event.status === 'published' && (
                    <Pressable
                      onPress={() => openDeleteModal(event)}
                      style={({ pressed }) => ({
                        marginTop: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#FECACA',
                        backgroundColor: pressed ? '#FEF2F2' : '#FFFBFB',
                        height: 42,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 8,
                      })}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      <Text style={{ color: '#B91C1C', fontSize: 14, fontWeight: '700' }}>Delete event</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeDeleteModal}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 22,
            backgroundColor: 'rgba(15, 23, 42, 0.52)',
          }}
        >
          <Pressable
            onPress={closeDeleteModal}
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Dismiss"
          />
          <View
            style={{
              width: '100%',
              maxWidth: 368,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              paddingHorizontal: 22,
              paddingTop: 26,
              paddingBottom: 20,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 12,
              zIndex: 1,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#FEF3C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Ionicons name="warning" size={30} color="#D97706" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
                Delete this event?
              </Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 }}>
                This will permanently remove{' '}
                <Text style={{ fontWeight: '700', color: '#334155' }}>
                  {deleteTarget?.title ?? 'this event'}
                </Text>{' '}
                and its data. You can’t undo this.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Pressable
                onPress={closeDeleteModal}
                disabled={deleteSubmitting}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  backgroundColor: pressed ? '#F8FAFC' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: deleteSubmitting ? 0.5 : 1,
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#475569' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteEvent}
                disabled={deleteSubmitting}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: pressed ? '#B91C1C' : '#DC2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  opacity: deleteSubmitting ? 0.75 : 1,
                })}
              >
                {deleteSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>Delete</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
