import React, { type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const BRAND = '#FF7B3F';
const INACTIVE = '#333333';

const TAB_WIDTH = 72;
const TAB_GAP = 12;
const ICON_SIZE = 24;
const LABEL_SIZE = 13;
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

function resolveCategoryIcon(icon: IoniconName, active: boolean): IoniconName {
  if (active) {
    return icon.endsWith('-outline')
      ? (icon.slice(0, -'-outline'.length) as IoniconName)
      : icon;
  }
  return icon.endsWith('-outline') ? icon : (`${icon}-outline` as IoniconName);
}

function CategoryTabItem({
  cat,
  active,
  onPress,
}: {
  cat: ExploreCategory;
  active: boolean;
  onPress: () => void;
}) {
  const iconName = resolveCategoryIcon(cat.icon, active);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.chip, active && styles.chipActive]}>
        <Ionicons name={iconName} size={ICON_SIZE} color={active ? BRAND : INACTIVE} />
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
    paddingRight: 4,
    paddingTop: 4,
    paddingBottom: 4,
  },
  tabItem: {
    width: TAB_WIDTH,
    alignItems: 'center',
  },
  chip: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  chipActive: {
    backgroundColor: '#FFEFE5',
  },
  tabLabel: {
    marginTop: ICON_LABEL_GAP,
    fontSize: LABEL_SIZE,
    lineHeight: 16,
    fontWeight: '500',
    color: INACTIVE,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: BRAND,
    fontWeight: '600',
  },
});
