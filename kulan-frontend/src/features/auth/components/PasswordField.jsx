import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/loginSignin/authStyles';

export default function PasswordField({ label, error, ...rest }) {
  const [show, setShow] = useState(false);

  const borderColor = error ? COLORS.danger : COLORS.border;

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
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          secureTextEntry={!show}
          placeholderTextColor={COLORS.placeholder}
          style={{ flex: 1, fontSize: 16, color: COLORS.textDark }}
          {...rest}
        />

        <Pressable onPress={() => setShow(!show)}>
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#64748B"
          />
        </Pressable>
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
