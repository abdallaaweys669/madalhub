import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { COLORS } from '@/constants/loginSignin/authStyles';

export default function TextField({ label, error, ...rest }) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? COLORS.danger
    : focused
    ? COLORS.primary
    : COLORS.border;

  return (
    <View style={{ marginBottom: error ? 4 : 16 }}>
      <Text style={{ marginBottom: 6, fontWeight: '600', color: COLORS.textDark }}>
        {label}
      </Text>

      <View
        style={{
          height: 50,
          backgroundColor: '#F8FAFC',
          borderRadius: 12,
          borderColor,
          borderWidth: 1.2,
          justifyContent: 'center',
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          {...rest}
          placeholderTextColor={COLORS.placeholder}
          style={{ fontSize: 16, color: COLORS.textDark }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            rest.onBlur && rest.onBlur();
          }}
        />
      </View>

      {error ? (
        <Text
          style={{
            color: COLORS.danger,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
