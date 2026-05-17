import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import EventVenueMap from '@/components/eventDetail/EventVenueMap';

export default function EventDirectionsMapModal({
  visible,
  latitude,
  longitude,
  venueLabel,
  addressLine,
  onNavigate,
  onClose,
}) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close map" />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Getting there</Text>
              {addressLine ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {addressLine}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>
          </View>

          <EventVenueMap
            latitude={latitude}
            longitude={longitude}
            venueLabel={venueLabel}
            mapHeight={300}
            style={styles.mapWrap}
          />

          <TouchableOpacity style={styles.navigateBtn} onPress={onNavigate} activeOpacity={0.9}>
            <Feather name="navigation" size={18} color="#FFFFFF" />
            <Text style={styles.navigateBtnText}>Start navigation</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 16,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapWrap: {
    marginTop: 0,
    marginBottom: 16,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF7B3F',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 4,
  },
  navigateBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
