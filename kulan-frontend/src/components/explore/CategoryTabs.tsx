import React, { type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ExploreCategory = {
  id: string;
  icon: IoniconName;
};

type CategoryTabsProps = {
  categories: ExploreCategory[];
  activeId: string;
  onChange: (id: string) => void;
};

export function CategoryTabs({ categories, activeId, onChange }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      decelerationRate="fast"
    >
      {categories.map((cat) => {
        const active = cat.id === activeId;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
            onPress={() => onChange(cat.id)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={cat.icon}
              size={14}
              color={active ? '#FFFFFF' : '#596273'}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{cat.id}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingRight: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: '#FF7B3F',
    borderColor: '#FF7B3F',
  },
  tabInactive: {
    backgroundColor: '#FFF6F2',
    borderColor: '#FFE1D3',
  },
  tabLabel: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '600',
    color: '#596273',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});
