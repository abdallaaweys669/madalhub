import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/loginSignin/authStyles';

export default function TextField({ label, error, helperText, underline = false, inputStyle, ...rest }) {
  const [focused, setFocused] = useState(false);

  const lineColor = error
    ? COLORS.danger
    : focused
    ? COLORS.primary
    : underline ? 'rgba(0,0,0,0.18)' : COLORS.border;

  if (underline) {
    return (
      <View style={styles.ulWrap}>
        <Text style={styles.ulLabel}>{label}</Text>
        <View style={[styles.ulInputRow, { borderBottomColor: lineColor }]}>
          <TextInput
            {...rest}
            placeholderTextColor="rgba(0,0,0,0.28)"
            style={styles.ulInput}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              rest.onBlur && rest.onBlur();
            }}
          />
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: error ? 4 : 16 }}>
      <Text style={{ marginBottom: 6, fontWeight: '600', color: COLORS.textDark }}>
        {label}
      </Text>

      <View
        style={[
          {
            height: 50,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderColor: lineColor,
            borderWidth: 1.5,
            justifyContent: 'center',
            paddingHorizontal: 14,
          },
          inputStyle,
        ]}
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

      {error || helperText ? (
        <Text
          style={{
            color: error ? COLORS.danger : '#64748B',
            fontSize: 12,
            marginTop: 4,
            lineHeight: 16,
          }}
        >
          {error || helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ulWrap: {
    marginBottom: 22,
  },
  ulLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  ulInputRow: {
    borderBottomWidth: 1.5,
    paddingBottom: 8,
  },
  ulInput: {
    fontSize: 17,
    color: COLORS.textDark,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 5,
  },
});
