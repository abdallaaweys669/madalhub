import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing, useThemeColors } from '@/theme';

export type HomeEventTab = 'Upcoming' | 'Joined' | 'Saved' | 'Past';

const TABS: HomeEventTab[] = ['Upcoming', 'Joined', 'Saved', 'Past'];
const GUEST_TABS: HomeEventTab[] = ['Upcoming'];

const TAB_ICONS: Record<HomeEventTab, keyof typeof Ionicons.glyphMap> = {
  Upcoming: 'calendar-outline',
  Joined: 'checkmark-circle-outline',
  Saved: 'bookmark-outline',
  Past: 'time-outline',
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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Events</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        nestedScrollEnabled
      >
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
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.85}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={TAB_ICONS[tab]}
                size={16}
                color={active ? '#FFFFFF' : colors.text}
              />
              <Text style={[styles.tabLabel, { color: active ? '#FFFFFF' : colors.text }]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  titleRow: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
    flexGrow: 1,
  },
  tab: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: TAB_ICON_GAP,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
