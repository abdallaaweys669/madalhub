import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ExploreActiveFilterChip } from '@/components/explore/exploreFilterUtils';

const BRAND = '#FF7B3F';

type ExploreActiveFilterChipsProps = {
  chips: ExploreActiveFilterChip[];
  onRemove: (key: ExploreActiveFilterChip['key']) => void;
  onClearAll: () => void;
};

export function ExploreActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: ExploreActiveFilterChipsProps) {
  if (!chips.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={() => onRemove(chip.key)}
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${chip.label} filter`}
        >
          <Text style={styles.chipText} numberOfLines={1}>
            {chip.label}
          </Text>
          <Ionicons name="close" size={14} color="#C2410C" />
        </Pressable>
      ))}
      <Pressable
        onPress={onClearAll}
        style={({ pressed }) => [styles.clearChip, pressed && styles.chipPressed]}
        accessibilityRole="button"
        accessibilityLabel="Clear all filters"
      >
        <Text style={styles.clearText}>Clear all</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 160,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    backgroundColor: '#FFFBF7',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
  },
  chipPressed: {
    opacity: 0.86,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    color: '#C2410C',
    flexShrink: 1,
  },
  clearChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  clearText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: BRAND,
  },
});
