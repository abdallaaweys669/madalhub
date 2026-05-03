import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { useThemeColors, spacing } from '@/theme';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

function initialsFromName(name) {
  if (!name || typeof name !== 'string') return 'O';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatEventWhen(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function pickHeroEvent(events) {
  if (!events?.length) return null;
  const now = new Date();
  const upcoming = events
    .filter((e) => e.status === 'published' && new Date(e.startsAt) >= now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  if (upcoming.length) return upcoming[0];
  const drafts = events.filter((e) => e.status === 'draft').sort((a, b) => b.id - a.id);
  if (drafts.length) return drafts[0];
  const publishedAny = events
    .filter((e) => e.status === 'published')
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  return publishedAny[0] || null;
}

function urgencyLabel(ev) {
  if (!ev) return '';
  if (ev.status === 'draft') return 'Draft — publish when ready';
  const start = new Date(ev.startsAt);
  const end = new Date(ev.endsAt);
  const now = new Date();
  if (now > end) return 'Past event';
  if (now >= start && now <= end) return 'Happening now';
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((startDay - today) / 86400000);
  if (diffDays === 0) return 'Starts today';
  if (diffDays === 1) return 'Starts tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `Starts in ${diffDays} days`;
  return 'Upcoming';
}

function formatPriceLabel(totalPrice) {
  const n = Number(totalPrice);
  if (!Number.isFinite(n) || n <= 0) return 'Free';
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

function registrationSummary(ev) {
  const n = ev.registrationCount ?? 0;
  const cap = Number(ev.capacity);
  if (Number.isFinite(cap) && cap > 0) return `${n} / ${cap} registered`;
  return `${n} registered`;
}

export default function OrganizerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await organizerApi.getOrganizerEvents();
      setEvents(data);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const heroEvent = useMemo(() => pickHeroEvent(events), [events]);
  const recentEvents = useMemo(() => {
    const rest = heroEvent ? events.filter((e) => e.id !== heroEvent.id) : events;
    return rest.slice(0, 5);
  }, [events, heroEvent]);

  const stats = {
    total: events.length,
    draft: events.filter((e) => e.status === 'draft').length,
    published: events.filter((e) => e.status === 'published').length,
  };

  const statMeta = [
    { label: 'Total', value: stats.total, icon: 'layers', tint: `${colors.primary}18`, iconColor: colors.primary },
    { label: 'Drafts', value: stats.draft, icon: 'edit-3', tint: '#F59E0B22', iconColor: '#D97706' },
    { label: 'Live', value: stats.published, icon: 'radio', tint: colors.tagOnlineBg, iconColor: colors.tagOnlineFg },
  ];

  const avatarUri = resolveApiAssetUrl(user?.profileImg || user?.avatarUrl);
  const padH = spacing.lg;
  const cardRadius = 20;
  const thumbRadius = 16;

  const openHero = () => {
    if (!heroEvent) return;
    router.push({ pathname: '/(organizer)/edit-event', params: { eventId: heroEvent.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundMuted }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{
          paddingHorizontal: padH,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.xl + 8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.textSecondary,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              Organizer
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: colors.text,
                marginTop: 4,
                letterSpacing: -0.6,
              }}
            >
              Dashboard
            </Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 6, lineHeight: 22 }}>
              Hi, {user?.fullName?.split(' ')?.[0] || 'there'} — manage your events in one place.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(organizer)/profile')}
            style={({ pressed }) => ({
              opacity: pressed ? 0.88 : 1,
              shadowColor: colors.text,
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            })}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: colors.border,
                }}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, '#FF9B5C']}
                style={{ width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 17 }}>{initialsFromName(user?.fullName)}</Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: spacing.lg,
          }}
        >
          <Pressable onPress={() => router.push('/(organizer)/my-events')}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>My events</Text>
          </Pressable>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>·</Text>
          <Pressable onPress={() => router.push('/(organizer)/profile')}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>Profile</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.lg }}>
          {statMeta.map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: cardRadius,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: stat.tint,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <Feather name={stat.icon} size={16} color={stat.iconColor} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{stat.value}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {!loading && heroEvent ? (
          <Pressable
            onPress={openHero}
            style={({ pressed }) => ({
              marginBottom: spacing.lg,
              borderRadius: cardRadius,
              overflow: 'hidden',
              opacity: pressed ? 0.94 : 1,
              borderWidth: 1,
              borderColor: colors.border,
            })}
          >
            {resolveApiAssetUrl(heroEvent.coverImage) ? (
              <ImageBackground
                source={{ uri: resolveApiAssetUrl(heroEvent.coverImage) }}
                style={{ minHeight: 160, justifyContent: 'flex-end', borderRadius: cardRadius, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={{ padding: 16 }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#FDE68A', marginBottom: 4 }}>
                    {urgencyLabel(heroEvent)}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }} numberOfLines={2}>
                    {heroEvent.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 6 }} numberOfLines={1}>
                    {formatEventWhen(heroEvent.startsAt)}
                    {heroEvent.locationName ? ` · ${heroEvent.locationName}` : ''}
                  </Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                    {formatPriceLabel(heroEvent.totalPrice)} · {registrationSummary(heroEvent)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>Manage</Text>
                    <Feather name="chevron-right" size={18} color="#FFF" style={{ marginLeft: 4 }} />
                  </View>
                </LinearGradient>
              </ImageBackground>
            ) : (
              <LinearGradient
                colors={[colors.primarySoft, `${colors.primary}33`]}
                style={{ padding: 18, borderRadius: cardRadius }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, marginBottom: 4 }}>
                  {urgencyLabel(heroEvent)}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }} numberOfLines={2}>
                  {heroEvent.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6 }} numberOfLines={2}>
                  {formatEventWhen(heroEvent.startsAt)}
                  {heroEvent.locationName ? ` · ${heroEvent.locationName}` : ''}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  {formatPriceLabel(heroEvent.totalPrice)} · {registrationSummary(heroEvent)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>Manage</Text>
                  <Feather name="chevron-right" size={18} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>
              </LinearGradient>
            )}
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push('/(organizer)/create-event')}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: cardRadius,
            height: 54,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.xl,
            opacity: pressed ? 0.94 : 1,
            borderWidth: 1,
            borderColor: 'transparent',
            shadowColor: colors.primary,
            shadowOpacity: 0.22,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
            elevation: 4,
          })}
        >
          <Feather name="plus-circle" size={21} color="white" style={{ marginRight: 10 }} />
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 }}>Create new event</Text>
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>Recent events</Text>
          <Pressable onPress={() => router.push('/(organizer)/my-events')} hitSlop={8}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>View all</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ minHeight: 220, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : events.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: cardRadius,
              padding: spacing.xl,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 10 }}>Get started</Text>
            {[
              { step: 1, title: 'Create your event', body: 'Set title, time, and location.', onPress: () => router.push('/(organizer)/create-event') },
              { step: 2, title: 'Add cover & details', body: 'Upload a cover image and fill in the description.', onPress: () => router.push('/(organizer)/create-event') },
              { step: 3, title: 'Publish when ready', body: 'Switch from draft to live so people can register.', onPress: () => router.push('/(organizer)/my-events') },
            ].map((row) => (
              <Pressable
                key={row.step}
                onPress={row.onPress}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 12,
                  borderBottomWidth: row.step < 3 ? 1 : 0,
                  borderBottomColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 10,
                    backgroundColor: colors.primarySoft,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>{row.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{row.title}</Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2, lineHeight: 20 }}>{row.body}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textSecondary} style={{ marginTop: 2 }} />
              </Pressable>
            ))}
          </View>
        ) : (
          recentEvents.map((event) => {
            const coverUri = resolveApiAssetUrl(event.coverImage);
            const when = formatEventWhen(event.startsAt);
            const isLive = event.status === 'published';
            const urgency = urgencyLabel(event);
            return (
              <Pressable
                key={event.id}
                onPress={() => router.push({ pathname: '/(organizer)/edit-event', params: { eventId: event.id } })}
                style={({ pressed }) => ({
                  backgroundColor: colors.card,
                  borderRadius: cardRadius,
                  padding: 14,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: pressed ? 0.92 : 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                })}
              >
                <View style={{ marginRight: 14 }}>
                  {coverUri ? (
                    <Image
                      source={{ uri: coverUri }}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: thumbRadius,
                        backgroundColor: colors.border,
                      }}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#FF9B5C', colors.primary]}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: thumbRadius,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 22 }}>
                        {(event.title || 'E').slice(0, 1).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  )}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      right: -6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                      backgroundColor: isLive ? colors.tagOnlineBg : '#FEF3C7',
                      borderWidth: 2,
                      borderColor: colors.card,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: isLive ? colors.tagOnlineFg : '#B45309',
                        textTransform: 'uppercase',
                      }}
                    >
                      {isLive ? 'Live' : 'Draft'}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }} numberOfLines={1}>
                    {urgency}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 2 }} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
                    {when ? `${when} · ` : ''}
                    {event.locationName || 'Location TBD'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
                    {formatPriceLabel(event.totalPrice)} · {registrationSummary(event)}
                  </Text>
                </View>
                <Feather name="chevron-right" size={22} color={colors.textSecondary} style={{ marginLeft: 4 }} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
