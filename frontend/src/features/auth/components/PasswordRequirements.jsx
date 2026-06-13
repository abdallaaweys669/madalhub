import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/loginSignin/authStyles';
import { PASSWORD_MIN_LENGTH } from '@/features/auth/validation/authRules';

const RULES = [
  {
    key: 'length',
    label: `${PASSWORD_MIN_LENGTH} characters`,
  },
  {
    key: 'upper',
    label: '1 capital letter',
  },
  {
    key: 'lower',
    label: '1 small letter',
  },
  {
    key: 'number',
    label: '1 number',
  },
];

function RequirementPill({ met, label }) {
  return (
    <View style={[styles.pill, met ? styles.pillMet : styles.pillPending]}>
      {met ? (
        <Ionicons name="checkmark" size={14} color="#15803D" style={styles.tick} />
      ) : null}
      <Text style={[styles.pillText, met && styles.pillTextMet]}>{label}</Text>
    </View>
  );
}

export default function PasswordRequirements({ checks }) {
  const allMet = useMemo(
    () => RULES.every((rule) => checks[rule.key]),
    [checks],
  );

  if (allMet) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {RULES.map((rule) => (
        <RequirementPill key={rule.key} met={checks[rule.key]} label={rule.label} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  pillPending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillMet: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tick: {
    marginRight: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  pillTextMet: {
    color: '#15803D',
    fontWeight: '600',
  },
});
