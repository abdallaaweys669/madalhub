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
import { useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import useAuth from '@/auth/useAuth';
import { pickDisplayName } from '@/auth/normalizeUser';
import { getEventById } from '@/api/events';
import { toDisplayTitle } from '@/utils/eventDisplay';
import { buildTicketQrValue, shareEventRegistration } from '@/utils/eventRegistration';

export default function EventTicketScreen() {
  const { id } = useLocalSearchParams();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const eventId = Array.isArray(id) ? id[0] : id;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const memberName = pickDisplayName(user) || 'Member';
  const userId = user?.id ?? user?.sub ?? '';
  const qrValue = event ? buildTicketQrValue(event.id, userId) : '';

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
          <Text style={styles.errorText}>Ticket unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
          <Feather name="x" size={22} color="#64748B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your ticket</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticketCard}>
          <View style={styles.qrWrap}>
            <QRCode value={qrValue} size={210} color="#0F172A" backgroundColor="#FFFFFF" />
          </View>

          <View style={styles.perforation}>
            {Array.from({ length: 18 }).map((_, i) => (
              <View key={`dot-${i}`} style={styles.perfDot} />
            ))}
          </View>

          <Text style={styles.eventTitle}>{toDisplayTitle(event.title)}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {memberName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Organizer</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {event.organizerName || 'Organizer'}
            </Text>
          </View>

          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>Kulan · Show this at check-in</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => shareEventRegistration(event, memberName)}
          activeOpacity={0.9}
        >
          <Feather name="share-2" size={18} color="#FFFFFF" />
          <Text style={styles.shareBtnText}>Share ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.replace(`/events/${eventId}/going`)}
        >
          <Text style={styles.backLinkText}>Back to confirmation</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF7ED',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  qrWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  perforation: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 18,
    flexWrap: 'wrap',
  },
  perfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    minWidth: 72,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  brandRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF7B3F',
  },
  brandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF7B3F',
    letterSpacing: 0.3,
  },
  shareBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 15,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  backLink: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF7B3F',
  },
});
