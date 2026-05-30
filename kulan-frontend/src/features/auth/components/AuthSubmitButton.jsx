import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { COLORS } from '@/constants/loginSignin/authStyles';

export default function AuthSubmitButton({
  label,
  loadingLabel,
  loading,
  disabled,
  onPress,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          height: 50,
          backgroundColor: COLORS.primary,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: disabled || loading ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        loadingLabel ? (
          <Text style={{ color: 'white', fontSize: 17, fontWeight: '700' }}>{loadingLabel}</Text>
        ) : (
          <ActivityIndicator color="white" />
        )
      ) : (
        <Text style={{ color: 'white', fontSize: 17, fontWeight: '700' }}>{label}</Text>
      )}
    </Pressable>
  );
}
