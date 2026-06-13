import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

import { downloadQrFromRef, imageSaveAlertMessage, imageSaveAlertTitle } from '@/utils/saveQrCodeImage';

const ORANGE = '#FF7B3F';

export default function TicketQrModal({
  visible,
  qrValue,
  eventTitle,
  instituteName,
  onClose,
  onShare,
}) {
  const insets = useSafeAreaInsets();
  const qrRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!qrValue || downloading) return;

    setDownloading(true);
    try {
      const result = await downloadQrFromRef(qrRef);
      const title = imageSaveAlertTitle(result);
      const message = imageSaveAlertMessage(result);
      if (title && message) {
        Alert.alert(title, message);
      }
    } catch {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setDownloading(false);
    }
  }, [downloading, qrValue]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>Share ticket QR code</Text>
          <Text style={styles.subtitle}>Show this at check-in</Text>

          <View style={styles.qrTile}>
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={232}
                color="#0F172A"
                backgroundColor="#FFFFFF"
                getRef={(ref) => {
                  qrRef.current = ref;
                }}
              />
            ) : null}
          </View>

          {eventTitle ? (
            <Text style={styles.eventTitle} numberOfLines={2}>
              {eventTitle}
            </Text>
          ) : null}

          {instituteName ? (
            <Text style={styles.instituteText} numberOfLines={1}>
              {instituteName}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.outlineBtn, downloading && styles.outlineBtnDisabled]}
            onPress={handleDownload}
            activeOpacity={0.9}
            disabled={downloading || !qrValue}
          >
            {downloading ? (
              <ActivityIndicator color={ORANGE} size="small" />
            ) : (
              <Feather name="download" size={18} color={ORANGE} />
            )}
            <Text style={styles.outlineBtnText}>
              {downloading ? 'Saving…' : 'Download QR code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.solidBtn} onPress={onShare} activeOpacity={0.92}>
            <LinearGradient
              colors={['#FF7A00', '#FF9A3D']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.solidGradient}
            >
              <Feather name="share-2" size={18} color="#FFFFFF" />
              <Text style={styles.solidBtnText}>Share ticket</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrTile: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  instituteText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  outlineBtn: {
    marginTop: 22,
    width: '100%',
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  outlineBtnDisabled: {
    opacity: 0.75,
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: ORANGE,
  },
  solidBtn: {
    marginTop: 10,
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  solidGradient: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  solidBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
