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
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { useThemeColors } from '@/theme';
import KulanLogo from '@/assets/kulan_logo.svg';
import NoEventsIllustration from '@/assets/no events.svg';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
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
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      value: upcomingCount,
      hint: nearestUpcomingEvent
        ? `Next: ${formatDate(nearestUpcomingEvent.startsAt)}`
        : 'No upcoming events',
      icon: 'time-outline',
    },
    {
      key: 'drafts',
      label: 'Drafts',
      value: draftCount,
      hint: draftCount > 0 ? 'Ready to publish' : 'No drafts pending',
      icon: 'document-text-outline',
    },
  ];

  const hasEvents = sortedEvents.length > 0;
  const greetingName =
    organizationName || headerFullName || user?.organizationName || user?.fullName || 'Organizer';
  const headerInitials = initials(organizationName || headerFullName || user?.fullName);
  const headerSubtitle = loading
    ? 'Loading your dashboard...'
    : hasEvents
      ? nearestUpcomingEvent
        ? `Next event: ${formatDateTime(nearestUpcomingEvent.startsAt)}`
        : 'Manage your events and keep your audience engaged'
      : 'Start by creating your first event';
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
        <View style={{ marginBottom: 14, position: 'relative', minHeight: 88 }}>
          <Pressable
            onPress={() => router.push('/(organizer)/profile')}
            style={{
              position: 'absolute',
              right: 0,
              top: 8,
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#FFD2BF',
              backgroundColor: '#FFE9DD',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              overflow: 'hidden',
            }}
          >
            {headerProfileImg ? (
              <Image source={{ uri: headerProfileImg }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '800' }}>{headerInitials}</Text>
            )}
          </Pressable>

          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
            <KulanLogo width={170} height={52} preserveAspectRatio="xMidYMid meet" />
          </View>
          <Text
            style={{
              marginTop: 8,
              fontSize: 15,
              color: '#6E6E75',
              fontWeight: '600',
              letterSpacing: 0.2,
              textAlign: 'left',
            }}
          >
            Good morning, {greetingName}
          </Text>
          <Text style={{ marginTop: 4, color: '#8E8E95', fontSize: 12 }}>
            {headerSubtitle}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
          {metricCards.map((card) => (
            <View
              key={card.key}
              style={{
                width: '50%',
                paddingHorizontal: 4,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  minHeight: 88,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: '#E7E7EA',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text
                    style={{
                      fontSize: 10,
                      color: '#8D8D93',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    {card.label}
                  </Text>
                  <Ionicons name={card.icon} size={14} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 30, fontWeight: '800', color: '#17171B', marginTop: 4 }}>
                  {card.value}
                </Text>
                <Text style={{ fontSize: 10, color: '#8D8D93', marginTop: 2 }}>{card.hint}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/(organizer)/create-event')}
          style={({ pressed }) => ({
            marginTop: 2,
            marginBottom: 16,
            height: 52,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
            shadowColor: colors.primary,
            shadowOpacity: 0.24,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 3,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={{ fontWeight: '800', color: '#FFFFFF', fontSize: 15, marginLeft: 8 }}>
              Create new event
            </Text>
          </View>
        </Pressable>

        <View style={{ marginBottom: 12 }}>
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

        {loading ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !hasEvents ? (
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
              minHeight: 260,
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
            const coverUrl = event.image || event.coverImage ? resolveApiAssetUrl(event.image || event.coverImage) : null;
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
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 14,
                  overflow: 'hidden',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                {/* Image Header */}
                <View style={{ height: 154, width: '100%', backgroundColor: '#F8FAFC', position: 'relative' }}>
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
                    </View>
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0' }}>
                      <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                      {isEnded && (
                        <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)' }}>
                          <Image source={terminalBadgeSource} style={{ width: 140, height: 140 }} resizeMode="contain" />
                        </View>
                      )}
                    </View>
                  )}
                  {/* Status Overlay */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      backgroundColor: chip.bg,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Ionicons name={event.status === 'draft' ? "document-text" : "radio-button-on"} size={12} color={chip.fg} />
                    <Text style={{ color: chip.fg, fontSize: 11, fontWeight: '800' }}>{chip.label}</Text>
                  </View>
                </View>

                {/* Body Content */}
                <View style={{ padding: 14 }}>
                  {/* Tags Row */}
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name={locationKind === 'ONLINE' ? 'videocam-outline' : 'location-outline'} size={11} color="#475569" />
                      <Text style={{ color: '#475569', fontSize: 10, fontWeight: '700' }}>{locationKind}</Text>
                    </View>
                    <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name={priceLabel === 'Free' ? 'cash-outline' : 'card-outline'} size={11} color="#166534" />
                      <Text style={{ color: '#166534', fontSize: 10, fontWeight: '700' }}>{priceLabel}</Text>
                    </View>
                  </View>

                  <Text style={{ color: '#0F172A', fontSize: 17, fontWeight: '800', marginBottom: 12 }} numberOfLines={2}>
                    {event.title}
                  </Text>

                  {/* Details Block */}
                  <View style={{ gap: 6, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="calendar-outline" size={14} color="#64748B" />
                      <Text style={{ color: '#475569', fontSize: 12, fontWeight: '500' }}>{startDateLabel}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="time-outline" size={14} color="#64748B" />
                      <Text style={{ color: '#475569', fontSize: 12, fontWeight: '500' }}>{startTimeLabel}</Text>
                    </View>
                  </View>

                  {/* Attendees Insight */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: showProgressBar ? 10 : 16 }}>
                    <Ionicons name="people" size={14} color="#64748B" />
                    <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: '600' }}>
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
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        height: 38,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F8FAFC'
                      }}
                    >
                      <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '700' }}>
                        {event.status === 'draft' ? 'Edit Draft' : 'Edit Event'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push(`/events/${event.id}`)}
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        height: 38,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fff'
                      }}
                    >
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
                          borderRadius: 8,
                          backgroundColor: colors.primary,
                          height: 38,
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
                          borderRadius: 8,
                          backgroundColor: '#FEF2F2',
                          borderWidth: 1,
                          borderColor: '#FECACA',
                          height: 38,
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
