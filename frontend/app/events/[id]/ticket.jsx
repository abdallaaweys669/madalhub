import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';

import TicketPassCard, {
  TICKET_ORANGE,
  TICKET_PAGE_BG,
} from '@/components/eventDetail/TicketPassCard';
import useAuth from '@/auth/useAuth';
import { getEventById } from '@/api/events';
import { toDisplayTitle } from '@/utils/eventDisplay';
import { shareEventRegistration } from '@/utils/eventRegistration';
import { imageSaveAlertMessage, imageSaveAlertTitle, saveImageFileToPhotos } from '@/utils/saveQrCodeImage';
import { buildTicketMeta } from '@/utils/ticketMeta';

export default function EventTicketScreen() {
  const { id } = useLocalSearchParams();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const eventId = Array.isArray(id) ? id[0] : id;

  const ticketCardRef = useRef(null);
  const qrRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const ticketMeta = event ? buildTicketMeta(event, user) : null;
  const displayTitle = event ? toDisplayTitle(event.title) : '';
  const instituteName = event?.organizerName?.trim() || 'Event organizer';
  const memberName = ticketMeta?.guestLabel || 'Member';

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

  const handleShare = () => {
    if (event) shareEventRegistration(event, memberName);
  };

  const handleDownload = useCallback(async () => {
    if (!ticketCardRef.current || downloading) return;

    setDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 120));
      const uri = await captureRef(ticketCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const result = await saveImageFileToPhotos(uri);
      const title = imageSaveAlertTitle(result);
      const message = imageSaveAlertMessage(result, 'ticket');
      if (title && message) {
        Alert.alert(title, message);
      }
    } catch {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator color={TICKET_ORANGE} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event || !ticketMeta) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Ticket unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Feather name="chevron-left" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Ticket</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn} hitSlop={12}>
          <Feather name="share-2" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        <TicketPassCard
          ref={ticketCardRef}
          event={event}
          displayTitle={displayTitle}
          subtitle={ticketMeta.subtitle}
          ticketMeta={ticketMeta}
          instituteName={instituteName}
          qrValue={ticketMeta.qrValue}
          qrRef={qrRef}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.downloadPill}
            onPress={handleDownload}
            activeOpacity={0.92}
            disabled={downloading}
          >
            <LinearGradient
              colors={['#FF7A00', '#FF9A3D']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.pillInner}
            >
              {downloading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Feather name="download" size={17} color="#FFFFFF" />
              )}
              <Text style={styles.downloadText}>
                {downloading ? 'Saving…' : 'Download ticket'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sharePill} onPress={handleShare} activeOpacity={0.88}>
            <Feather name="share-2" size={17} color={TICKET_ORANGE} />
            <Text style={styles.shareText}>Share ticket</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securityNote}>
          <Feather name="shield" size={14} color="#94A3B8" />
          <Text style={styles.securityText}>Keep this QR code safe and do not share it publicly.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TICKET_PAGE_BG,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  downloadPill: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  pillInner: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sharePill: {
    flex: 1,
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: TICKET_ORANGE,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareText: {
    fontSize: 15,
    fontWeight: '700',
    color: TICKET_ORANGE,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 17,
    textAlign: 'center',
  },
});
