import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import organizerApi from '@/api/organizer';
import { useThemeColors, spacing } from '@/theme';

const FILTER_TABS = ['all', 'draft', 'published', 'past'];

function formatPriceLabel(totalPrice) {
  const n = Number(totalPrice);
  if (!Number.isFinite(n) || n <= 0) return 'Free';
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

function registrationSummary(ev) {
  const n = ev.registrationCount ?? 0;
  const cap = Number(ev.capacity);
  if (Number.isFinite(cap) && cap > 0) return `${n} / ${cap}`;
  return `${n} reg.`;
}

export default function MyEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await organizerApi.getOrganizerEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter((e) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'past') return e.status === 'published' && new Date(e.endsAt) < new Date();
    return e.status === activeTab;
  });

  const cardRadius = 18;

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundMuted }}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }} hitSlop={8}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>My events</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
          {FILTER_TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeTab === tab ? colors.primary : colors.card,
                marginRight: 8,
                borderWidth: activeTab === tab ? 0 : 1,
                borderColor: colors.border,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: activeTab === tab ? '#FFFFFF' : colors.textSecondary,
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, minHeight: 200, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl }}>
          <Feather name="calendar" size={44} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 16, color: colors.textSecondary }}>No events in this category</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((event) => (
            <Pressable
              key={event.id}
              onPress={() => router.push({ pathname: '/(organizer)/edit-event', params: { eventId: event.id } })}
              style={({ pressed }) => ({
                backgroundColor: colors.card,
                borderRadius: cardRadius,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.94 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{event.title}</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                    {event.locationName || 'No location'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {new Date(event.startsAt).toLocaleDateString()} · {event.status}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    {formatPriceLabel(event.totalPrice)} · {registrationSummary(event)}
                  </Text>
                </View>
                <Feather name="edit-2" size={18} color={colors.primary} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
