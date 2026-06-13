import React from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

export default function TicketingCapacityModal({
  visible,
  onClose,
  ticketPaid,
  onChangeTicketPaid,
  totalPrice,
  onChangeTotalPrice,
  capacity,
  onChangeCapacity,
}) {
  return (
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
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Ticketing & Capacity</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Pressable
              onPress={() => onChangeTicketPaid(false)}
              style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: !ticketPaid ? '#FF7A00' : '#E5E7EB', paddingVertical: 11, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '700', color: '#111827' }}>Free</Text>
            </Pressable>
            <Pressable
              onPress={() => onChangeTicketPaid(true)}
              style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: ticketPaid ? '#FF7A00' : '#E5E7EB', paddingVertical: 11, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '700', color: '#111827' }}>Paid</Text>
            </Pressable>
          </View>
          {ticketPaid ? (
            <TextInput
              value={totalPrice}
              onChangeText={onChangeTotalPrice}
              placeholder="Price in USD"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 10 }}
            />
          ) : null}
          <TextInput
            value={capacity}
            onChangeText={onChangeCapacity}
            placeholder="Capacity (0 = unlimited)"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
