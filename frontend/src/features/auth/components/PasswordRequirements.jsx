import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PASSWORD_MIN_LENGTH } from '@/features/auth/validation/authRules';

const RULES = [
  { key: 'length', label: `${PASSWORD_MIN_LENGTH}+ chars` },
  { key: 'upper', label: '1 uppercase' },
  { key: 'lower', label: '1 lowercase' },
  { key: 'number', label: '1 number' },
];

function getStrengthColor(checks) {
  const score = RULES.filter((rule) => checks[rule.key]).length;
  if (score >= 4) return '#16A34A';
  if (score >= 3) return '#F59E0B';
  return '#FF7B3F';
}

function StrengthBar({ checks }) {
  const score = RULES.filter((rule) => checks[rule.key]).length;
  const fillPercent = `${(score / RULES.length) * 100}%`;

  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: fillPercent, backgroundColor: getStrengthColor(checks) }]} />
    </View>
  );
}

function RuleItem({ met, label, isLast }) {
  return (
    <View style={styles.ruleItem}>
      <Ionicons
        name={met ? 'checkmark' : 'close'}
        size={13}
        color={met ? '#16A34A' : '#EF4444'}
        style={styles.ruleIcon}
      />
      <Text style={styles.ruleText} numberOfLines={1}>
        {label}
      </Text>
      {!isLast ? <Text style={styles.ruleSep}>|</Text> : null}
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
      <StrengthBar checks={checks} />

      <View style={styles.rulesRow}>
        {RULES.map((rule, index) => (
          <RuleItem
            key={rule.key}
            met={checks[rule.key]}
            label={rule.label}
            isLast={index === RULES.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    marginBottom: 12,
    gap: 8,
  },
  barTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  rulesRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ruleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  ruleIcon: {
    marginRight: 2,
  },
  ruleText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  ruleSep: {
    marginHorizontal: 4,
    fontSize: 11,
    color: '#D1D5DB',
    flexShrink: 0,
  },
});
