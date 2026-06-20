import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getOrganizerAnalytics } from '@/api/organizer';
import OrganizerStackHeader from '@/features/organizer/components/OrganizerStackHeader';
import { formatCount, formatRating } from '@/components/organizer/OrganizerProfileChrome';
import { COLORS } from '@/theme/colors';

function MetricCard({ label, value, accent = COLORS.primary, bg = '#FFF7ED' }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: '46%',
        borderRadius: 16,
        padding: 14,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: `${accent}22`,
        marginBottom: 10,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: '900', color: accent }}>{value}</Text>
      <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

export default function OrganizerAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const next = await getOrganizerAnalytics();
    setData(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const topEvents = Array.isArray(data?.topEventsByAttendees) ? data.topEventsByAttendees : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <OrganizerStackHeader title="Analytics" />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          <Text style={{ color: COLORS.textSecondary, marginBottom: 14, fontSize: 14 }}>
            Overview of your events, audience, and reputation.
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <MetricCard label="Total events" value={formatCount(data?.eventsTotal)} />
            <MetricCard label="Total attendees" value={formatCount(data?.totalAttendees)} accent="#2563EB" bg="#EFF6FF" />
            <MetricCard label="Followers" value={formatCount(data?.followersCount)} accent="#7C3AED" bg="#F5F3FF" />
            <MetricCard
              label="Average rating"
              value={formatRating(data?.ratingAverage)}
              accent="#059669"
              bg="#ECFDF5"
            />
            <MetricCard label="Drafts" value={formatCount(data?.drafts)} accent="#4F46E5" bg="#EEF2FF" />
            <MetricCard label="Upcoming" value={formatCount(data?.upcoming)} accent="#FF7B3F" bg="#FFF7ED" />
            <MetricCard label="Live / active" value={formatCount(data?.publishedActive)} accent="#059669" bg="#ECFDF5" />
            <MetricCard label="Past events" value={formatCount(data?.past)} accent="#64748B" bg="#F8FAFC" />
          </View>

          <Text
            style={{
              marginTop: 10,
              marginBottom: 10,
              color: COLORS.textSecondary,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 1,
            }}
          >
            TOP EVENTS BY REGISTRATIONS
          </Text>

          {topEvents.length === 0 ? (
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              Publish events and collect registrations to see performance here.
            </Text>
          ) : (
            topEvents.map((event) => (
              <View
                key={event.eventId}
                style={{
                  borderRadius: 14,
                  backgroundColor: COLORS.card,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.textPrimary }} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, textTransform: 'capitalize' }}>
                    {event.status}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary, marginLeft: 12 }}>
                  {formatCount(event.registrationCount)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
