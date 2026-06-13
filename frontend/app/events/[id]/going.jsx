import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuth from '@/auth/useAuth';
import { pickDisplayName } from '@/auth/normalizeUser';
import { DEFAULT_COVER_GRADIENT, getEventById, leaveEvent } from '@/api/events';
import { EventCoverBanner } from '@/components/event/EventCoverBanner';
import EditAttendanceSheet from '@/components/eventDetail/EditAttendanceSheet';
import { formatEventDetailDateTime, toDisplayTitle } from '@/utils/eventDisplay';
import { addEventToCalendar, shareEventRegistration } from '@/utils/eventRegistration';
import { formatEventLocationDisplay } from '@/utils/eventLocation';

function EventGoingScreen() {
  const { id } = useLocalSearchParams();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const eventId = Array.isArray(id) ? id[0] : id;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);

  const memberName = pickDisplayName(user) || 'Member';

  const load = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getEventById(eventId);
      setEvent(data);
      if (!data?.isJoined) {
        router.replace(`/events/${eventId}`);
      }
    } catch {
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const { datePrimary, dateSecondary } = formatEventDetailDateTime(event?.startsAt, event?.endsAt);
  const location = formatEventLocationDisplay(event);
  const isOnline =
    event?.isOnline === true ||
    String(event?.locationName || '').trim().toLowerCase() === 'online';

  const handleAttendanceUpdate = async (stillGoing) => {
    setEditVisible(false);
    if (stillGoing) return;
    try {
      await leaveEvent(eventId);
      router.replace(`/events/${eventId}`);
    } catch {
      /* keep on screen */
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator color="#FF7B3F" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 158 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 8 }}>
          <EventCoverBanner
            preset="detail"
            coverImageUrl={event.coverImageUrl}
            coverLetter={event.coverLetter}
            title={event.title}
            coverGradient={event.coverGradient ?? DEFAULT_COVER_GRADIENT}
            placeholderLetterSize={56}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.registeredPill}>
            <Feather name="check-circle" size={15} color="#16A34A" />
            <Text style={styles.registeredPillText}>You&apos;re registered</Text>
          </View>

          <Text style={styles.title}>{toDisplayTitle(event.title)}</Text>

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Feather name="clock" size={16} color="#FF7B3F" />
              </View>
              <View style={styles.metaTextCol}>
                <Text style={styles.metaPrimary}>{datePrimary}</Text>
                {dateSecondary ? <Text style={styles.metaSecondary}>{dateSecondary}</Text> : null}
              </View>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Feather name={isOnline ? 'video' : 'map-pin'} size={16} color="#FF7B3F" />
              </View>
              <View style={styles.metaTextCol}>
                <Text style={styles.metaPrimary}>
                  {isOnline ? 'Online event' : location.venueLine || 'Venue TBA'}
                </Text>
                {!isOnline && location.areaLine ? (
                  <Text style={styles.metaSecondary}>{location.areaLine}</Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => addEventToCalendar(event)}
              activeOpacity={0.88}
            >
              <View style={[styles.quickIconWrap, styles.quickIconOrange]}>
                <Feather name="calendar" size={18} color="#FF7B3F" />
              </View>
              <Text style={styles.quickActionLabel}>Add to calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => shareEventRegistration(event, memberName)}
              activeOpacity={0.88}
            >
              <View style={[styles.quickIconWrap, styles.quickIconNeutral]}>
                <Feather name="share-2" size={18} color="#0F172A" />
              </View>
              <Text style={styles.quickActionLabel}>Share event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.joinedRow}>
          <View style={styles.goingRow}>
            <Feather name="check-circle" size={17} color="#16A34A" />
            <Text style={styles.goingText}>You&apos;re going!</Text>
          </View>
          <TouchableOpacity onPress={() => setEditVisible(true)} hitSlop={8} activeOpacity={0.8}>
            <Text style={styles.editLink}>Edit attendance</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push(`/events/${eventId}/ticket`)}
          activeOpacity={0.92}
        >
          <LinearGradient
            colors={['#FF7A00', '#FF9A3D']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
            <Text style={styles.ctaText}>View ticket</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <EditAttendanceSheet
        visible={editVisible}
        isGoing
        onClose={() => setEditVisible(false)}
        onUpdate={handleAttendanceUpdate}
      />
    </SafeAreaView>
  );
}

export default EventGoingScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#64748B',
    fontSize: 15,
  },
  scroll: {
    flexGrow: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  registeredPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  registeredPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  metaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTextCol: {
    flex: 1,
    paddingTop: 1,
  },
  metaPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
  },
  metaSecondary: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  metaDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginLeft: 48,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickIconOrange: {
    backgroundColor: '#FFF7ED',
  },
  quickIconNeutral: {
    backgroundColor: '#F8FAFC',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  goingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  goingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF7B3F',
  },
  ctaButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaGradient: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
