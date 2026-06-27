import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useGuardedRouter from '@/hooks/useGuardedRouter';

const ORANGE = '#FF7B3F';

export default function OrganizerBioReminderBanner() {
  const router = useGuardedRouter();

  return (
    <Pressable
      onPress={() => router.push('/(organizer)/edit-profile')}
      accessibilityRole="button"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,123,63,0.22)',
        backgroundColor: '#FFF7F3',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Ionicons name="create-outline" size={20} color={ORANGE} />
      <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: '#9A3412', fontWeight: '600' }}>
        Add a bio to complete your organizer profile.
      </Text>
      <Ionicons name="chevron-forward" size={18} color={ORANGE} />
    </Pressable>
  );
}
