import React, { useMemo } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import OrganizerTabScaffold from '@/features/organizer/components/OrganizerTabScaffold';
import useOrganizerDashboardData from '@/features/organizer/hooks/useOrganizerDashboardData';
import {
  computeOrganizerMetrics,
  countUpcomingOrganizerEvents,
  formatOrganizerDateTime,
  getUpcomingOrganizerEvents,
  organizerEventStatusChip,
  resolveOrganizerEventCoverUrl,
} from '@/features/organizer/utils/organizerEventUtils';
import {
  getOrganizerBannerPressHref,
  getOrganizerBannerStyles,
  getOrganizerDashboardBanner,
} from '@/utils/organizerPublish';
import { useThemeColors } from '@/theme';
import OrganizerDashboardSkeleton from '@/components/skeletons/OrganizerDashboardSkeleton';
import useAuth from '@/auth/useAuth';

function UpcomingEventCard({ event, onPress }) {
  const coverUrl = resolveOrganizerEventCoverUrl(event);
  const chip = organizerEventStatusChip(event);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={{ width: '100%', height: 118 }} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={{ height: 118, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="calendar-outline" size={28} color="#EA580C" />
        </LinearGradient>
      )}
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ backgroundColor: chip.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: chip.fg, fontSize: 11, fontWeight: '800' }}>{chip.label}</Text>
          </View>
          <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>
            {formatOrganizerDateTime(event.startsAt)}
          </Text>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }} numberOfLines={2}>
          {event.title}
        </Text>
      </View>
    </Pressable>
  );
}

export default function OrganizerHomeScreen() {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { user } = useAuth();
  const {
    events,
    organizationName,
    headerFullName,
    verificationStatus,
    publishEligibility,
    loading,
    refreshing,
    onRefresh,
  } = useOrganizerDashboardData();

  const greetingName = organizationName || headerFullName || user?.fullName || 'Organizer';
  const statusBanner = getOrganizerDashboardBanner(publishEligibility, verificationStatus);
  const bannerStyles = statusBanner ? getOrganizerBannerStyles(statusBanner.tone) : null;
  const { totalAttendees, nearestUpcomingEvent } = useMemo(
    () => computeOrganizerMetrics(events),
    [events],
  );
  const upcomingPreview = useMemo(() => getUpcomingOrganizerEvents(events, 3), [events]);
  const upcomingTotal = useMemo(() => countUpcomingOrganizerEvents(events), [events]);

  const metricCards = [
    { label: 'Events', value: events.length, accent: '#FF7A00', bg: '#FFF7ED', icon: 'calendar-outline' },
    { label: 'Attendees', value: totalAttendees, accent: '#2563EB', bg: '#EFF6FF', icon: 'people-outline' },
    { label: 'Upcoming', value: upcomingTotal, accent: '#059669', bg: '#ECFDF5', icon: 'time-outline' },
  ];

  if (loading) {
    return (
      <OrganizerTabScaffold title="Home" orgName={greetingName}>
        <OrganizerDashboardSkeleton />
      </OrganizerTabScaffold>
    );
  }

  return (
    <OrganizerTabScaffold title="Home" orgName={greetingName}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#FF7A00', '#FF9F45']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20, marginBottom: 16 }}
        >
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: '700' }}>Welcome back</Text>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginTop: 4, letterSpacing: -0.4 }}>
            {greetingName}
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 8, lineHeight: 20 }}>
            {nearestUpcomingEvent
              ? `Your next event starts ${formatOrganizerDateTime(nearestUpcomingEvent.startsAt)}`
              : 'Create your next event and start filling seats.'}
          </Text>
        </LinearGradient>

        {statusBanner ? (
          <Pressable
            onPress={() => router.push(getOrganizerBannerPressHref(publishEligibility, verificationStatus))}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: bannerStyles.border,
              backgroundColor: bannerStyles.bg,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: bannerStyles.fg, fontWeight: '800', flex: 1, paddingRight: 8 }}>{statusBanner.text}</Text>
            <Ionicons name="chevron-forward" size={18} color={bannerStyles.fg} />
          </Pressable>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          {metricCards.map((card) => (
            <View key={card.label} style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#EEF2F7',
                  minHeight: 96,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: card.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name={card.icon} size={16} color={card.accent} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>{card.value}</Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 4 }}>{card.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>Upcoming events</Text>
          {upcomingTotal > 1 ? (
            <Pressable onPress={() => router.push('/(organizer)/(tabs)/events')}>
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>See all</Text>
            </Pressable>
          ) : null}
        </View>

        {upcomingPreview.length === 0 ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: '#EEF2F7',
              padding: 22,
              alignItems: 'center',
            }}
          >
            <Ionicons name="sparkles-outline" size={28} color="#EA580C" />
            <Text style={{ marginTop: 10, fontSize: 16, fontWeight: '800', color: '#0F172A' }}>No upcoming events</Text>
            <Text style={{ marginTop: 6, color: '#64748B', textAlign: 'center', lineHeight: 20 }}>
              Publish a draft or create a new event to see it here.
            </Text>
            <Pressable
              onPress={() => router.push('/(organizer)/create-event')}
              style={{
                marginTop: 14,
                backgroundColor: colors.primary,
                borderRadius: 999,
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Create event</Text>
            </Pressable>
          </View>
        ) : (
          upcomingPreview.map((event) => (
            <UpcomingEventCard
              key={event.id}
              event={event}
              onPress={() =>
                router.push({ pathname: '/(organizer)/manage-event', params: { eventId: event.id } })
              }
            />
          ))
        )}

        {upcomingTotal > upcomingPreview.length ? (
          <Pressable
            onPress={() => router.push('/(organizer)/(tabs)/events')}
            style={{
              marginTop: 4,
              height: 46,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontWeight: '800', color: '#0F172A' }}>See more events</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </OrganizerTabScaffold>
  );
}
