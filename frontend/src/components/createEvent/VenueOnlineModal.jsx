import React from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocationPickerModal from '@/components/createEvent/LocationPickerModal';

export const LOCATION_TBD_LABEL = 'To be announced';

const MODES = [
  { id: 'venue', label: 'Venue' },
  { id: 'online', label: 'Online' },
  { id: 'tbd', label: 'TBD' },
];

export default function VenueOnlineModal({
  visible,
  onClose,
  locationMode,
  onChangeLocationMode,
  locationName,
  locationAddress,
  onChangeLocationName,
  onChangeLocationAddress,
  locationPin,
  onlineLink,
  onChangeOnlineLink,
  onOpenMap,
  mapVisible,
  onCloseMap,
  onSelectLocation,
}) {
  const insets = useSafeAreaInsets();
  const footerPad = Math.max(insets.bottom, 16);
  const windowHeight = Dimensions.get('window').height;
  const compactSheetMinHeight = Math.round(windowHeight * 0.52);
  const isCompactMode = locationMode === 'online' || locationMode === 'tbd';

  const renderOnlineBody = () => (
    <View style={styles.compactBody}>
      <Text style={styles.fieldLabel}>Meeting link</Text>
      <TextInput
        value={onlineLink}
        onChangeText={onChangeOnlineLink}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="https://meet.google.com/..."
        placeholderTextColor="#9CA3AF"
        style={styles.input}
      />
    </View>
  );

  const renderTbdBody = () => (
    <View style={styles.compactBody}>
      <View style={styles.tbdCard}>
        <View style={styles.tbdHeader}>
          <Feather name="clock" size={18} color="#64748B" />
          <Text style={styles.tbdTitle}>Location to be announced</Text>
        </View>
        <Text style={styles.tbdBody}>
          Use this when the venue is not confirmed yet.
        </Text>
        <Text style={styles.tbdBodySecondary}>
          Attendees will see that you will share the location before the event.
        </Text>
      </View>
    </View>
  );

  const renderVenueBody = () => (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.venueScroll}
      contentContainerStyle={styles.venueScrollContent}
    >
      <View style={styles.sectionGap}>
        <View>
          <Text style={styles.fieldLabel}>Venue name</Text>
          <TextInput
            value={locationName}
            onChangeText={onChangeLocationName}
            placeholder="e.g. Jazeera University, City Hall"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Address or details (optional)</Text>
          <TextInput
            value={locationAddress}
            onChangeText={onChangeLocationAddress}
            placeholder="Street, district, room number, landmarks…"
            placeholderTextColor="#9CA3AF"
            multiline
            style={[styles.input, styles.inputMultiline]}
          />
        </View>
        <Pressable
          onPress={onOpenMap}
          style={[styles.mapCard, locationPin ? styles.mapCardPinned : styles.mapCardEmpty]}
        >
          <View style={[styles.mapIcon, locationPin ? styles.mapIconPinned : styles.mapIconEmpty]}>
            <Feather
              name={locationPin ? 'check-circle' : 'map-pin'}
              size={20}
              color={locationPin ? '#16A34A' : '#EA580C'}
            />
          </View>
          <View style={styles.mapCardBody}>
            <Text style={[styles.mapCardTitle, locationPin && styles.mapCardTitlePinned]}>
              {locationPin ? 'Map pin saved' : 'Pin on map (optional)'}
            </Text>
            <Text style={styles.mapCardSub} numberOfLines={2}>
              {locationPin
                ? 'Members can open directions to this spot.'
                : 'Search or drop a pin if you want turn-by-turn directions.'}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#9CA3AF" />
        </Pressable>
      </View>
    </ScrollView>
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetWrap}
          >
            <View
              style={[
                styles.sheet,
                { paddingBottom: footerPad },
                isCompactMode && { minHeight: compactSheetMinHeight },
              ]}
            >
              <View style={styles.handle} />
              <Text style={styles.title}>Where does it happen?</Text>
              <Text style={styles.subtitle}>
                Type a venue, go online, or mark location as TBD. Map pin is optional.
              </Text>

              <View style={styles.modeRow}>
                {MODES.map((mode) => {
                  const active = locationMode === mode.id;
                  return (
                    <Pressable
                      key={mode.id}
                      onPress={() => onChangeLocationMode(mode.id)}
                      style={[styles.modeChip, active && styles.modeChipActive]}
                    >
                      <Text style={styles.modeChipText}>{mode.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.body, isCompactMode && styles.bodyCompact]}>
                {locationMode === 'venue' ? renderVenueBody() : null}
                {locationMode === 'online' ? renderOnlineBody() : null}
                {locationMode === 'tbd' ? renderTbdBody() : null}
              </View>

              <View style={styles.footer}>
                <Pressable onPress={onClose} style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <LocationPickerModal
        visible={mapVisible}
        onClose={onCloseMap}
        onSelectLocation={onSelectLocation}
        initialLocation={{
          latitude: locationPin?.latitude,
          longitude: locationPin?.longitude,
          name: locationName,
          address: locationAddress,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.48)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: '88%',
    flexDirection: 'column',
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#111827',
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 20,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modeChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeChipActive: {
    borderColor: '#FF7A00',
    backgroundColor: '#FFF7ED',
  },
  modeChipText: {
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    flexShrink: 0,
  },
  bodyCompact: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  compactBody: {
    paddingBottom: 4,
  },
  venueScroll: {
    maxHeight: 360,
  },
  venueScrollContent: {
    paddingBottom: 8,
  },
  sectionGap: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  mapCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapCardEmpty: {
    borderStyle: 'dashed',
    borderColor: '#FDBA74',
    backgroundColor: '#FFFBF5',
  },
  mapCardPinned: {
    borderStyle: 'solid',
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  mapIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIconEmpty: {
    backgroundColor: '#FFF7ED',
  },
  mapIconPinned: {
    backgroundColor: '#DCFCE7',
  },
  mapCardBody: {
    flex: 1,
    minWidth: 0,
  },
  mapCardTitle: {
    fontWeight: '800',
    color: '#9A3412',
  },
  mapCardTitlePinned: {
    color: '#166534',
  },
  mapCardSub: {
    color: '#6B7280',
    marginTop: 4,
  },
  tbdCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    padding: 16,
    gap: 10,
  },
  tbdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tbdTitle: {
    flex: 1,
    fontWeight: '700',
    color: '#111827',
    fontSize: 15,
  },
  tbdBody: {
    color: '#374151',
    lineHeight: 22,
    fontSize: 15,
    fontWeight: '600',
  },
  tbdBodySecondary: {
    color: '#4B5563',
    lineHeight: 22,
    fontSize: 15,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 'auto',
    backgroundColor: '#fff',
  },
  doneButton: {
    borderRadius: 12,
    backgroundColor: '#FF7A00',
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
