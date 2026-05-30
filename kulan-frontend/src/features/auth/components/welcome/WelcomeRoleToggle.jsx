import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '@/constants/loginSignin/authStyles';

export default function WelcomeRoleToggle({ role, onRoleChange }) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onRoleChange('member')}
        style={[styles.segment, role === 'member' && styles.segmentActive]}
      >
        <Feather
          name="user"
          size={18}
          color={role === 'member' ? '#FFFFFF' : COLORS.textDark}
        />
        <Text style={[styles.label, role === 'member' && styles.labelActive]}>Member</Text>
      </Pressable>

      <Pressable
        onPress={() => onRoleChange('organizer')}
        style={[styles.segment, role === 'organizer' && styles.segmentActive]}
      >
        <Feather
          name="calendar"
          size={18}
          color={role === 'organizer' ? '#FFFFFF' : COLORS.textDark}
        />
        <Text style={[styles.label, role === 'organizer' && styles.labelActive]}>Organizer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minWidth: 268,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
