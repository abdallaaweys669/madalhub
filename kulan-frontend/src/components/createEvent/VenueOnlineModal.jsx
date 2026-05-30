import React from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import LocationPickerModal from '@/components/createEvent/LocationPickerModal';

export default function VenueOnlineModal({
  visible,
  onClose,
  isInPerson,
  onChangeIsInPerson,
  locationName,
  locationAddress,
  locationPin,
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
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Where does it happen?</Text>
            <Text style={{ color: '#6B7280', marginBottom: 14 }}>
              Choose a venue pin for directions, or add an online meeting link.
            </Text>
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
              <Pressable
                onPress={onOpenMap}
                style={{
                  borderWidth: 1,
                  borderStyle: locationPin ? 'solid' : 'dashed',
                  borderColor: locationPin ? '#BBF7D0' : '#FDBA74',
                  borderRadius: 14,
                  padding: 14,
                  backgroundColor: locationPin ? '#F0FDF4' : '#FFFBF5',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: locationPin ? '#DCFCE7' : '#FFF7ED',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name={locationPin ? 'check-circle' : 'map-pin'} size={20} color={locationPin ? '#16A34A' : '#EA580C'} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '800', color: locationPin ? '#166534' : '#9A3412' }}>
                    {locationName || 'Choose venue on map'}
                  </Text>
                  <Text style={{ color: '#6B7280', marginTop: 4 }} numberOfLines={2}>
                    {locationAddress || 'Search, use current location, or drop a pin.'}
                  </Text>
                  {locationPin ? (
                    <Text style={{ color: '#16A34A', marginTop: 6, fontWeight: '700', fontSize: 12 }}>
                      Exact pin saved for member directions
                    </Text>
                  ) : null}
                </View>
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
