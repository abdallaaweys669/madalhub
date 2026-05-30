import React from 'react';
import { Text, View } from 'react-native';

import { COLORS } from '@/constants/loginSignin/authStyles';

export default function AuthDivider({ label = 'or continue with' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
      <Text style={{ marginHorizontal: 12, color: COLORS.textLight, fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
    </View>
  );
}
