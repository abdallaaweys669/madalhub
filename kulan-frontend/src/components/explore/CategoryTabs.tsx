import React, { type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { toFilledCategoryIcon } from '@/components/explore/exploreCategoryIcons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const BRAND = '#FF7B3F';
const CHIP_BG = '#FFF0E6';
const CHIP_BG_ACTIVE = '#FFDFCC';
const LABEL_COLOR = '#374151';

const TAB_WIDTH = 78;
const TAB_GAP = 18;
const CHIP_SIZE = 58;
const ICON_SIZE = 26;
const LABEL_SIZE = 13;
const ICON_LABEL_GAP = 8;

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
      <View style={[styles.chip, active && styles.chipActive]}>
        <Ionicons name={iconName} size={ICON_SIZE} color={BRAND} />
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
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabItem: {
    width: TAB_WIDTH,
    alignItems: 'center',
  },
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: CHIP_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CHIP_BG,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: CHIP_BG_ACTIVE,
    borderColor: BRAND,
  },
  tabLabel: {
    marginTop: ICON_LABEL_GAP,
    fontSize: LABEL_SIZE,
    lineHeight: 16,
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
