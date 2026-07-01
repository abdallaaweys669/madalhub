import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toFilledCategoryIcon } from '@/components/explore/exploreCategoryIcons';
import { EVENT_LIST_CHIPS } from '@/features/organizer/utils/organizerEventsFilters';

const BRAND = '#FF7B3F';
const ICON_INACTIVE = '#9CA3AF';
const LABEL_COLOR = '#374151';

function EventChipTab({ chip, active, onPress }) {
  const iconName = active ? toFilledCategoryIcon(chip.icon) : chip.icon;

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${chip.id} events`}
    >
      <View style={styles.iconSlot}>
        <Ionicons
          name={iconName}
          size={active ? 26 : 24}
          color={active ? BRAND : ICON_INACTIVE}
        />
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
        {chip.id}
      </Text>
    </TouchableOpacity>
  );
}

export default function OrganizerEventsChipTabs({ activeTab, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      decelerationRate="fast"
      style={styles.scroll}
    >
      {EVENT_LIST_CHIPS.map((chip) => (
        <EventChipTab
          key={chip.id}
          chip={chip}
          active={activeTab === chip.id}
          onPress={() => onChange(chip.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 14,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingRight: 8,
    paddingTop: 2,
    paddingBottom: 4,
  },
  tabItem: {
    minWidth: 68,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  iconSlot: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    color: LABEL_COLOR,
    textAlign: 'center',
    maxWidth: 72,
  },
  tabLabelActive: {
    color: BRAND,
    fontWeight: '700',
  },
});
