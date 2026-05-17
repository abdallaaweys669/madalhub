import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import { pickDisplayName } from '@/auth/normalizeUser';
import { getEventById, leaveEvent } from '@/api/events';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import EditAttendanceSheet from '@/components/eventDetail/EditAttendanceSheet';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';
import { formatEventDetailDateTime, toDisplayTitle } from '@/utils/eventDisplay';
import { addEventToCalendar, shareEventRegistration } from '@/utils/eventRegistration';
import { formatEventLocationDisplay } from '@/utils/eventLocation';

export default function EventGoingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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
        <View style={styles.center}>
          <ActivityIndicator color="#FF7B3F" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.replace(`/events/${eventId}`)}
        hitSlop={10}
        accessibilityLabel="Back to event"
      >
        <Feather name="arrow-left" size={22} color="#0F172A" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverWrap}>
          {event.coverImageUrl ? (
            <Image source={{ uri: event.coverImageUrl }} style={styles.cover} resizeMode="cover" />
          ) : (
            <CoverPlaceholder
              letter={event.coverLetter ?? event.title}
              gradient={event.coverGradient ?? DEFAULT_COVER_GRADIENT}
              borderRadius={20}
              style={styles.cover}
              letterSize={48}
            />
          )}
          <View style={styles.goingBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#FF7B3F" />
            <Text style={styles.goingBadgeText}>You&apos;re going!</Text>
          </View>
        </View>

        <Text style={styles.title}>{toDisplayTitle(event.title)}</Text>

        <View style={styles.metaRow}>
          <Feather name="clock" size={16} color="#64748B" />
          <View style={styles.metaTextCol}>
            <Text style={styles.metaPrimary}>{datePrimary}</Text>
            {dateSecondary ? <Text style={styles.metaSecondary}>{dateSecondary}</Text> : null}
          </View>
        </View>

        <View style={styles.metaRow}>
          <Feather name={isOnline ? 'video' : 'map-pin'} size={16} color="#64748B" />
          <View style={styles.metaTextCol}>
            <Text style={styles.metaPrimary}>
              {isOnline ? 'Online event' : location.venueLine || 'Venue TBA'}
            </Text>
            {!isOnline && location.areaLine ? (
              <Text style={styles.metaSecondary}>{location.areaLine}</Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => addEventToCalendar(event)}
          activeOpacity={0.9}
        >
          <Feather name="calendar" size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Add to calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => shareEventRegistration(event, memberName)}
          activeOpacity={0.9}
        >
          <Feather name="share-2" size={18} color="#0F172A" />
          <Text style={styles.secondaryActionText}>Share with friends</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomTitle}>You&apos;re going!</Text>
          <TouchableOpacity onPress={() => setEditVisible(true)} hitSlop={8}>
            <Text style={styles.bottomEdit}>Edit attendance</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.ticketBtn}
          onPress={() => router.push(`/events/${eventId}/ticket`)}
          activeOpacity={0.9}
        >
          <Feather name="maximize" size={16} color="#FFFFFF" />
          <Text style={styles.ticketBtnText}>Ticket</Text>
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
  backBtn: {
    marginLeft: 12,
    marginTop: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  coverWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: 200,
  },
  goingBadge: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  goingBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF7B3F',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  metaTextCol: {
    flex: 1,
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
  primaryAction: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 15,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryAction: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  secondaryActionText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  bottomLeft: {
    flex: 1,
  },
  bottomTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bottomEdit: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: '#FF7B3F',
  },
  ticketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF7B3F',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  ticketBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
