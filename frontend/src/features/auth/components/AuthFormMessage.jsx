import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/loginSignin/authStyles';

export default function AuthFormMessage({ message }) {
  if (!message) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        marginBottom: 14,
      }}
    >
      <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
      <Text style={{ flex: 1, color: '#B91C1C', fontSize: 13, lineHeight: 18, fontWeight: '600' }}>
        {message}
      </Text>
    </View>
  );
}
