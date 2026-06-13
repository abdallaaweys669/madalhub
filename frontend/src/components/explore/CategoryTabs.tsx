import React, { type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { toFilledCategoryIcon } from '@/components/explore/exploreCategoryIcons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const BRAND = '#FF7B3F';
const ICON_INACTIVE = '#9CA3AF';
const LABEL_COLOR = '#374151';

const TAB_WIDTH = 64;
const TAB_GAP = 14;
const ICON_SIZE = 24;
const ICON_SIZE_ACTIVE = 26;
const LABEL_SIZE = 12;
const ICON_LABEL_GAP = 4;

export type ExploreCategory = {
  id: string;
  icon: IoniconName;
};

type CategoryTabsProps = {
  categories: ExploreCategory[];
  activeId: string;
  onChange: (id: string) => void;
};

function CategoryTabItem({
  cat,
  active,
  onPress,
}: {
  cat: ExploreCategory;
  active: boolean;
  onPress: () => void;
}) {
  const iconName = toFilledCategoryIcon(cat.icon);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${cat.id} category`}
    >
      <View style={styles.iconSlot}>
        <Ionicons
          name={iconName}
          size={active ? ICON_SIZE_ACTIVE : ICON_SIZE}
          color={active ? BRAND : ICON_INACTIVE}
        />
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
        {cat.id}
      </Text>
    </TouchableOpacity>
  );
}

export function CategoryTabs({ categories, activeId, onChange }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      decelerationRate="fast"
    >
      {categories.map((cat) => (
        <CategoryTabItem
          key={cat.id}
          cat={cat}
          active={cat.id === activeId}
          onPress={() => onChange(cat.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: TAB_GAP,
    paddingRight: 8,
    paddingTop: 2,
    paddingBottom: 4,
  },
  tabItem: {
    width: TAB_WIDTH,
    alignItems: 'center',
  },
  iconSlot: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: ICON_LABEL_GAP,
    fontSize: LABEL_SIZE,
    lineHeight: 14,
    fontWeight: '500',
    color: LABEL_COLOR,
    textAlign: 'center',
    maxWidth: TAB_WIDTH,
  },
  tabLabelActive: {
    color: BRAND,
    fontWeight: '700',
  },
});
