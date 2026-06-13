import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import {
  EXPLORE_TIME_FILTER_OPTIONS,
  type ExploreDateFilter,
} from '@/components/explore/exploreDateFilters';

const BRAND = '#FF7B3F';

type ExploreTimeFilterTabsProps = {
  activeId: ExploreDateFilter;
  onChange: (id: ExploreDateFilter) => void;
};

export function ExploreTimeFilterTabs({ activeId, onChange }: ExploreTimeFilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      decelerationRate="fast"
    >
      {EXPLORE_TIME_FILTER_OPTIONS.map((option) => {
        const active = option.id === activeId;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={({ pressed }) => [
              styles.pill,
              active ? styles.pillActive : styles.pillInactive,
              pressed ? styles.pillPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${option.label} time filter`}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
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
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#FFF7ED',
    borderColor: BRAND,
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  pillPressed: {
    opacity: 0.88,
  },
  pillText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  pillTextActive: {
    color: '#C2410C',
    fontWeight: '800',
  },
});
