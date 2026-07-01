import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getOverviewPeriodLabel,
  OVERVIEW_PERIOD_OPTIONS,
} from '@/features/organizer/utils/organizerEventUtils';

export default function OrganizerOverviewPeriodPicker({ value = 'all', onChange }) {
  const [open, setOpen] = useState(false);
  const label = getOverviewPeriodLabel(value);

  const selectPeriod = (id) => {
    onChange?.(id);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Stats period: ${label}. Tap to change.`}
      >
        <Text style={styles.pillText}>{label}</Text>
        <Ionicons name="chevron-down" size={13} color="#EA580C" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>Show stats for</Text>
            {OVERVIEW_PERIOD_OPTIONS.map((option) => {
              const selected = option.id === value;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => selectPeriod(option.id)}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
                  {selected ? <Ionicons name="checkmark-circle" size={18} color="#EA580C" /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    backgroundColor: '#FFF7ED',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 6,
  },
  pillPressed: {
    opacity: 0.9,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: '#FFF7ED',
  },
  optionPressed: {
    opacity: 0.88,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionTextSelected: {
    color: '#C2410C',
  },
});
