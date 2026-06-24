import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function loadCameraScannerModule() {
  // Metro-safe lazy load — avoid dynamic import() async chunks on Android.
  return require('./TicketQrScannerCamera').default;
}

export default function TicketQrScanner({ visible, onClose, onScan, scanning = false }) {
  const insets = useSafeAreaInsets();
  const cameraModuleRef = useRef(null);
  const [CameraScanner, setCameraScanner] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCameraScanner(null);
      setLoadError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);

    try {
      if (!cameraModuleRef.current) {
        cameraModuleRef.current = loadCameraScannerModule();
      }
      setCameraScanner(() => cameraModuleRef.current);
    } catch {
      setLoadError(true);
      setCameraScanner(null);
    } finally {
      setLoading(false);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan ticket</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#FF7A00" size="large" />
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={styles.helpText}>
              Ticket scanning needs a dev build with camera support. Rebuild the app, then try again:
            </Text>
            <Text style={styles.codeText}>npx expo run:android</Text>
            <Pressable style={styles.permissionBtn} onPress={onClose}>
              <Text style={styles.permissionBtnText}>Close</Text>
            </Pressable>
          </View>
        ) : CameraScanner ? (
          <CameraScanner onClose={onClose} onScan={onScan} scanning={scanning} />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  helpText: {
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  codeText: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
