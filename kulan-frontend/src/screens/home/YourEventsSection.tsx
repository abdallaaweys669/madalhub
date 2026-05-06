import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing, useThemeColors } from '@/theme';

export type HomeEventTab = 'Upcoming' | 'Past' | 'Going' | 'Saved';

const TABS: HomeEventTab[] = ['Upcoming', 'Past', 'Going', 'Saved'];
const GUEST_TABS: HomeEventTab[] = ['Upcoming', 'Past'];

const TAB_ICONS: Record<HomeEventTab, keyof typeof Ionicons.glyphMap> = {
  Upcoming: 'calendar-outline',
  Past: 'time-outline',
  Going: 'checkmark-circle-outline',
  Saved: 'bookmark-outline',
};

/** Space between pill icon and label */
const TAB_ICON_GAP = 7;

type YourEventsSectionProps = {
  activeTab: HomeEventTab;
  onTabChange: (tab: HomeEventTab) => void;
  isGuest?: boolean;
};

export function YourEventsSection({
  activeTab,
  onTabChange,
  isGuest = false,
}: YourEventsSectionProps) {
  const colors = useThemeColors();
  const availableTabs = isGuest ? GUEST_TABS : TABS;

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Events</Text>
      </View>
      <View style={styles.tabs}>
        {availableTabs.map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabChange(tab)}
              style={[
                styles.tab,
                active
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.backgroundMuted },
              ]}
              activeOpacity={0.85}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={TAB_ICONS[tab]}
                size={18}
                color={active ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? '#FFFFFF' : colors.text },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  titleRow: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    gap: TAB_ICON_GAP,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
