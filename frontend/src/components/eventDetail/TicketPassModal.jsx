import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';

import CelebrationConfetti from '@/components/eventDetail/CelebrationConfetti';
import TicketPassCard, { TICKET_ORANGE } from '@/components/eventDetail/TicketPassCard';
import { toDisplayTitle } from '@/utils/eventDisplay';
import { shareEventRegistration } from '@/utils/eventRegistration';
import { imageSaveAlertMessage, imageSaveAlertTitle, saveImageFileToPhotos } from '@/utils/saveQrCodeImage';
import { buildTicketMeta } from '@/utils/ticketMeta';

export default function TicketPassModal({
  visible,
  onClose,
  event,
  user,
  celebrate = false,
}) {
  const insets = useSafeAreaInsets();
  const ticketCardRef = useRef(null);
  const qrRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const ticketMeta = event ? buildTicketMeta(event, user) : null;
  const displayTitle = event ? toDisplayTitle(event.title) : '';
  const instituteName = event?.organizerName?.trim() || 'Event organizer';
  const memberName = ticketMeta?.guestLabel || 'Member';

  useEffect(() => {
    if (!visible) {
      setShowConfetti(false);
      return;
    }
    if (celebrate) {
      setConfettiKey((key) => key + 1);
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2400);
      return () => clearTimeout(timer);
    }
    setShowConfetti(false);
  }, [visible, celebrate]);

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

  if (!event || !ticketMeta) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close ticket" />

        <View style={StyleSheet.absoluteFill} pointerEvents="none" key={confettiKey}>
          <CelebrationConfetti active={showConfetti} />
        </View>

        <View style={[styles.sheet, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Feather name="x" size={22} color={TICKET_ORANGE} />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>My Ticket</Text>
            <TouchableOpacity onPress={handleShare} style={styles.closeBtn} hitSlop={10}>
              <Feather name="share-2" size={18} color={TICKET_ORANGE} />
            </TouchableOpacity>
          </View>

          {celebrate ? (
            <View style={styles.celebrateRow}>
              <Text style={styles.celebrateEmoji}>🎉</Text>
              <Text style={styles.celebrateText}>You&apos;re going!</Text>
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
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
          </ScrollView>

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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: TICKET_ORANGE,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  celebrateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  celebrateEmoji: {
    fontSize: 28,
  },
  celebrateText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  downloadPill: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
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
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    marginTop: 10,
    paddingHorizontal: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
  },
});
