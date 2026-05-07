import React from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import LocationPickerModal from '@/components/createEvent/LocationPickerModal';

export default function VenueOnlineModal({
  visible,
  onClose,
  isInPerson,
  onChangeIsInPerson,
  locationName,
  locationAddress,
  onlineLink,
  onChangeOnlineLink,
  onOpenMap,
  mapVisible,
  onCloseMap,
  onSelectLocation,
}) {
  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)' }} onPress={onClose}>
          <Pressable
            style={{
              marginTop: 'auto',
              backgroundColor: '#fff',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 16,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Where does it happen?</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <Pressable
                onPress={() => onChangeIsInPerson(true)}
                style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: isInPerson ? '#FF7A00' : '#E5E7EB', paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '700', color: '#111827' }}>Venue</Text>
              </Pressable>
              <Pressable
                onPress={() => onChangeIsInPerson(false)}
                style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: !isInPerson ? '#FF7A00' : '#E5E7EB', paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '700', color: '#111827' }}>Online</Text>
              </Pressable>
            </View>
            {isInPerson ? (
              <Pressable onPress={onOpenMap} style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: '#FDBA74', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontWeight: '700', color: '#9A3412' }}>{locationName || 'Tap to pin venue on map'}</Text>
                <Text style={{ color: '#6B7280', marginTop: 4 }}>{locationAddress || 'Drop a pin to auto-fill address'}</Text>
              </Pressable>
            ) : (
              <TextInput
                value={onlineLink}
                onChangeText={onChangeOnlineLink}
                autoCapitalize="none"
                placeholder="https://meet.google.com/..."
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
      <LocationPickerModal visible={mapVisible} onClose={onCloseMap} onSelectLocation={onSelectLocation} />
    </>
  );
}
