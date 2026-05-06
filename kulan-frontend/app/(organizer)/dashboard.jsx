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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { useThemeColors } from '@/theme';
import KulanLogo from '@/assets/kulan_logo.svg';
import NoEventsIllustration from '@/assets/no events.svg';

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
  const now = Date.now();
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pulse = useState(() => new Animated.Value(0))[0];

  const fetchEvents = useCallback(async () => {
    try {
      const [eventsData, statusData] = await Promise.all([
        organizerApi.getOrganizerEvents(),
        organizerApi.getOrganizerStatus().catch(() => null),
      ]);
      setEvents(eventsData);
      setOrganizationName((statusData?.organizationName ?? '').trim());
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
    organizationName || user?.organizationName || user?.fullName || 'Organizer';
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
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '800' }}>{initials(user?.fullName)}</Text>
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

        <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#202026', fontSize: 18, fontWeight: '800' }}>Your events</Text>
          {hasEvents ? (
            <Pressable onPress={() => router.push('/(organizer)/my-events')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>See all</Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : sortedEvents.length === 0 ? (
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
        ) : (
          sortedEvents.slice(0, 4).map((event) => {
            const chip = statusChip(event);
            const eventDate = formatDate(event.startsAt);
            const attendees = Number(event.registrationCount ?? 0);
            const capacity = Number(event.capacity ?? 0);
            const rightStat = capacity > 0 ? `${attendees}/${capacity}` : `${attendees}`;
            return (
              <View
                key={event.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E7E7EA',
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#16161A', fontSize: 15, fontWeight: '800', flex: 1, paddingRight: 8 }} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View
                    style={{
                      backgroundColor: chip.bg,
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ color: chip.fg, fontSize: 10, fontWeight: '800' }}>{chip.label}</Text>
                  </View>
                </View>

                <Text style={{ marginTop: 5, color: '#72727A', fontSize: 11 }} numberOfLines={1}>
                  {eventDate} • {formatEventMeta(event)}
                </Text>

                <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Attendees</Text>
                  <Text style={{ color: '#25252A', fontSize: 11, fontWeight: '700' }}>{rightStat}</Text>
                </View>

                <View
                  style={{
                    marginTop: 4,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: '#F0F0F2',
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${capacity > 0 ? Math.max(6, Math.min(100, (attendees / capacity) * 100)) : 8}%`,
                      height: 6,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>

                <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E3E3E8',
                      height: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#1C1C20', fontSize: 12, fontWeight: '700' }}>View details</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push({ pathname: '/(organizer)/edit-event', params: { eventId: event.id } })}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E3E3E8',
                      height: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#1C1C20', fontSize: 12, fontWeight: '700' }}>
                      {event.status === 'draft' ? 'Edit draft' : 'Edit event'}
                    </Text>
                  </Pressable>
                </View>

                {event.status === 'draft' ? (
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
                      marginTop: 8,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      height: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                    }}
                  >
                    <Ionicons name="rocket-outline" size={14} color="#fff" />
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '800', marginLeft: 6 }}>Publish event</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
