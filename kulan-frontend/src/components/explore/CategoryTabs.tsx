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
              size={16}
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
    paddingVertical: 2,
    paddingRight: 10,
    gap: 9,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#FF7A3D',
    borderColor: '#FF7A3D',
  },
  tabInactive: {
    backgroundColor: '#F1F3F5',
    borderColor: '#E7EAF0',
  },
  tabLabel: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#596273',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});
