import React, { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const BOX_COUNT = 6;

export default function OtpCodeInput({ value, onChange, disabled = false }) {
  const inputsRef = useRef([]);

  const digits = Array.from({ length: BOX_COUNT }, (_, index) => value[index] || '');

  const focusIndex = (index) => {
    const input = inputsRef.current[index];
    if (input) input.focus();
  };

  const emitChange = (nextDigits) => {
    onChange(nextDigits.join('').slice(0, BOX_COUNT));
  };

  const handleChange = (text, index) => {
    const cleaned = String(text || '').replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      emitChange(next);
      return;
    }

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, BOX_COUNT).split('');
      const next = [...digits];
      pasted.forEach((char, offset) => {
        if (index + offset < BOX_COUNT) next[index + offset] = char;
      });
      emitChange(next);
      const lastIndex = Math.min(index + pasted.length, BOX_COUNT - 1);
      focusIndex(lastIndex);
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    emitChange(next);
    if (index < BOX_COUNT - 1) focusIndex(index + 1);
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputsRef.current[index] = ref;
          }}
          style={[styles.box, digit ? styles.boxFilled : null]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(event) => handleKeyPress(event, index)}
          keyboardType="number-pad"
          maxLength={index === 0 ? BOX_COUNT : 1}
          editable={!disabled}
          selectTextOnFocus
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    maxWidth: 48,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 123, 63, 0.28)',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  boxFilled: {
    borderColor: '#FF7B3F',
  },
});
