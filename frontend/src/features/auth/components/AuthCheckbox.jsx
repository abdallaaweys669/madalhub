import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/loginSignin/authStyles';

export default function AuthCheckbox({ checked, onPress, label, error, wrapStyle }) {
  return (
    <View style={[styles.wrap, wrapStyle]}>
      <View style={styles.row}>
        <Pressable
          onPress={onPress}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          <View style={[styles.box, checked && styles.boxChecked, error && !checked && styles.boxError]}>
            {checked ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : null}
          </View>
        </Pressable>
        <View style={styles.labelWrap}>
          {typeof label === 'string' ? <Text style={styles.label}>{label}</Text> : label}
        </View>
      </View>
      {error && !checked ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  labelWrap: {
    flex: 1,
    paddingTop: 1,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  boxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  boxError: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
    marginLeft: 32,
  },
});
