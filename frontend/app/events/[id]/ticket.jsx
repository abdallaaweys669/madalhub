import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

import useAuth from '@/auth/useAuth';
import { pickDisplayName } from '@/auth/normalizeUser';
import { DEFAULT_COVER_GRADIENT, getEventById } from '@/api/events';
import { EventCoverBanner } from '@/components/event/EventCoverBanner';
import TicketPerforation from '@/components/eventDetail/TicketPerforation';
import TicketQrModal from '@/components/eventDetail/TicketQrModal';
import { formatEventDetailDateTime, toDisplayTitle } from '@/utils/eventDisplay';
import { formatEventLocationDisplay } from '@/utils/eventLocation';
import { buildTicketQrValue, shareEventRegistration } from '@/utils/eventRegistration';
import { downloadQrFromRef, imageSaveAlertMessage, imageSaveAlertTitle } from '@/utils/saveQrCodeImage';

const PAGE_BG = '#FFF7ED';
const FRAME_BG = '#F1F5F9';
const ORANGE = '#FF7B3F';

function DetailColumn({ label, value, iconName }) {
  return (
    <View style={styles.detailCol}>
      <View style={styles.detailLabelRow}>
        <View style={styles.detailIconWrap}>
          <Feather name={iconName} size={13} color={ORANGE} />
        </View>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

function DashedRule() {
  return (
    <View style={styles.dashedWrap}>
      <View style={[styles.dash, styles.dashFlex]} />
    </View>
  );
}

function OrangeConnector() {
  return (
    <View style={styles.connectorRow}>
      <View style={styles.connectorCap} />
      <View style={styles.connectorLine} />
      <View style={styles.connectorCap} />
    </View>
  );
}

export default function EventTicketScreen() {
  const { id } = useLocalSearchParams();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const eventId = Array.isArray(id) ? id[0] : id;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const qrSvgRef = useRef(null);

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

  const ticketMeta = useMemo(() => {
    if (!event) return null;
    const { datePrimary, dateSecondary } = formatEventDetailDateTime(event.startsAt, event.endsAt);
    const location = formatEventLocationDisplay(event);
    const isOnline =
      event.isOnline === true ||
      String(event.locationName || '').trim().toLowerCase() === 'online';

    const timeLabel = dateSecondary?.includes('–')
      ? dateSecondary.split('–')[0].trim()
      : dateSecondary || '—';

    const shortDate = event.startsAt
      ? new Date(event.startsAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : datePrimary;

    return {
      dateLabel: shortDate || '—',
      timeLabel,
      venueLabel: isOnline ? 'Online event' : location.venueLine || 'Venue TBA',
      guestLabel: memberName,
      isOnline,
    };
  }, [event, memberName]);

  const handleShare = () => {
    if (event) shareEventRegistration(event, memberName);
  };

  const handleDownloadQr = useCallback(async () => {
    if (!qrValue || downloadingQr) return;

    setDownloadingQr(true);
    try {
      const result = await downloadQrFromRef(qrSvgRef);
      const title = imageSaveAlertTitle(result);
      const message = imageSaveAlertMessage(result);
      if (title && message) {
        Alert.alert(title, message);
      }
    } catch {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setDownloadingQr(false);
    }
  }, [downloadingQr, qrValue]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator color={ORANGE} />
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

  const displayTitle = toDisplayTitle(event.title);
  const instituteName = event.organizerName?.trim() || 'Event organizer';
  const headlineDate = event.startsAt
    ? new Date(event.startsAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ticketMeta.dateLabel;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={10}>
          <Feather name="arrow-left" size={20} color={ORANGE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tickets</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn} hitSlop={10}>
          <Feather name="share-2" size={18} color={ORANGE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View collapsable={false} style={styles.ticketFrame}>
          <View style={styles.ticketBody}>
            <View style={styles.coverSection}>
              <EventCoverBanner
                preset="feed-flat"
                coverImageUrl={event.coverImageUrl}
                coverLetter={event.coverLetter}
                title={event.title}
                coverGradient={event.coverGradient ?? DEFAULT_COVER_GRADIENT}
                placeholderLetterSize={48}
                style={styles.coverBanner}
              />
            </View>

            <View style={styles.connectorZone}>
              <TicketPerforation cutoutColor={FRAME_BG} style={styles.connectorCutouts} />
              <OrangeConnector />
            </View>

            <View style={styles.stub}>
              <View style={styles.stubContent}>
                <Text style={styles.stubTitle}>{displayTitle}</Text>
                <Text style={styles.stubDate}>{headlineDate}</Text>

                <DashedRule />

                <View style={styles.detailRow}>
                  <DetailColumn label="Date" value={ticketMeta.dateLabel} iconName="calendar" />
                  <DetailColumn label="Time" value={ticketMeta.timeLabel} iconName="clock" />
                </View>
                <View style={styles.detailRow}>
                  <DetailColumn
                    label="Venue"
                    value={ticketMeta.venueLabel}
                    iconName={ticketMeta.isOnline ? 'video' : 'map-pin'}
                  />
                  <DetailColumn label="Guest" value={ticketMeta.guestLabel} iconName="user" />
                </View>
              </View>

              <View style={styles.stubPerforationSlot}>
                <TicketPerforation cutoutColor={FRAME_BG} style={styles.stubCutouts} />
              </View>

              <View style={styles.stubFooter}>
                <View style={styles.organizerBlock}>
                  <View style={styles.organizerIconWrap}>
                    <Feather name="briefcase" size={16} color={ORANGE} />
                  </View>
                  <View style={styles.organizerTextBlock}>
                    <Text style={styles.instituteLabel}>Organized by</Text>
                    <Text style={styles.instituteName} numberOfLines={2}>
                      {instituteName}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.downloadPill}
            onPress={handleDownloadQr}
            activeOpacity={0.92}
            disabled={downloadingQr || !qrValue}
          >
            <LinearGradient
              colors={['#FF7A00', '#FF9A3D']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.pillInner}
            >
              {downloadingQr ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Feather name="download" size={17} color="#FFFFFF" />
              )}
              <Text style={styles.sharePillText}>
                {downloadingQr ? 'Saving…' : 'Get ticket'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.qrPill}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.88}
          >
            <Ionicons name="qr-code-outline" size={20} color={ORANGE} />
            <Text style={styles.qrPillText}>QR code</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.replace(`/events/${eventId}/going`)}
        >
          <Text style={styles.backLinkText}>Back to confirmation</Text>
        </TouchableOpacity>
      </ScrollView>

      <TicketQrModal
        visible={qrModalVisible}
        qrValue={qrValue}
        eventTitle={displayTitle}
        instituteName={instituteName}
        onClose={() => setQrModalVisible(false)}
        onShare={handleShare}
      />

      {qrValue ? (
        <View style={styles.hiddenQr} pointerEvents="none" accessible={false}>
          <QRCode
            value={qrValue}
            size={512}
            color="#0F172A"
            backgroundColor="#FFFFFF"
            getRef={(ref) => {
              qrSvgRef.current = ref;
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE_BG,
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
    paddingBottom: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: '#FFFFFF',
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
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 4,
    overflow: 'visible',
  },
  ticketFrame: {
    backgroundColor: FRAME_BG,
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
    overflow: 'visible',
  },
  ticketBody: {
    overflow: 'visible',
  },
  coverSection: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  coverBanner: {
    borderRadius: 0,
    marginBottom: 0,
    aspectRatio: 16 / 9,
  },
  connectorZone: {
    position: 'relative',
    height: 28,
    justifyContent: 'center',
    zIndex: 4,
  },
  connectorCutouts: {
    ...StyleSheet.absoluteFillObject,
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 6,
    zIndex: 2,
  },
  connectorCap: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ORANGE,
  },
  connectorLine: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: ORANGE,
  },
  stub: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'visible',
  },
  stubContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  stubPerforationSlot: {
    position: 'relative',
    height: 28,
    zIndex: 5,
  },
  stubCutouts: {
    ...StyleSheet.absoluteFillObject,
  },
  stubFooter: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  stubTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  stubDate: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 14,
  },
  dashedWrap: {
    marginBottom: 14,
    overflow: 'hidden',
  },
  dash: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  dashFlex: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 14,
  },
  detailCol: {
    flex: 1,
    minWidth: 0,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  detailIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  instituteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  instituteName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'left',
  },
  organizerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: '100%',
  },
  organizerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
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
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  sharePillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  qrPill: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qrPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: ORANGE,
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: ORANGE,
  },
  hiddenQr: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: 512,
    height: 512,
    opacity: 0,
  },
});
