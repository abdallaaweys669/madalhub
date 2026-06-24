import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { parseTicketQrValue } from '@/utils/parseTicketQr';

export default function TicketQrScannerCamera({ onClose, onScan, scanning = false }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState('');
  const lastScanRef = useRef('');

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const handleBarcode = useCallback(
    ({ data }) => {
      if (scanning || !data || data === lastScanRef.current) return;
      const parsed = parseTicketQrValue(data);
      if (!parsed) {
        setError('Not a valid MadalHub ticket QR.');
        return;
      }
      lastScanRef.current = data;
      setError('');
      onScan?.(parsed);
    },
    [onScan, scanning],
  );

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.helpText}>Camera access is required to scan tickets at the door.</Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.cameraWrap}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? undefined : handleBarcode}
      />
      <View style={styles.frame} pointerEvents="none" />
      <Text style={styles.hint}>Point at the attendee&apos;s ticket QR code</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {scanning ? <Text style={styles.processing}>Verifying ticket…</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 16,
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
  cameraWrap: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  frame: {
    position: 'absolute',
    top: '22%',
    left: '12%',
    right: '12%',
    bottom: '32%',
    borderWidth: 2,
    borderColor: 'rgba(255,122,0,0.85)',
    borderRadius: 18,
  },
  hint: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    textAlign: 'center',
    color: '#FCA5A5',
    fontWeight: '700',
  },
  processing: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    color: '#FFFFFF',
    fontWeight: '800',
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
