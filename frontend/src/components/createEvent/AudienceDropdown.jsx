import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

const AUDIENCE_OPTIONS = [
  { key: 'all', label: 'Everyone' },
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
];

export default function AudienceDropdown({ value = 'all', onChange }) {
  const [open, setOpen] = useState(false);
  const selected = AUDIENCE_OPTIONS.find((o) => o.key === value) || AUDIENCE_OPTIONS[0];

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={eventStyles.sectionTitle}>Audience</Text>
      <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
        Who can discover and join this event.
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          backgroundColor: '#FAFAFA',
          paddingHorizontal: 14,
          paddingVertical: 13,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Feather name="users" size={18} color="#EA580C" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{selected.label}</Text>
        </View>
        <Feather name="chevron-down" size={18} color="#6B7280" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)' }} onPress={() => setOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              marginTop: 'auto',
              backgroundColor: '#fff',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 16,
              paddingBottom: 24,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '800', marginBottom: 12 }}>Audience</Text>
            {AUDIENCE_OPTIONS.map((option) => {
              const active = option.key === value;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    onChange(option.key);
                    setOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: active ? '800' : '600', color: active ? '#EA580C' : '#111827' }}>
                    {option.label}
                  </Text>
                  {active ? <Feather name="check" size={18} color="#EA580C" /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
