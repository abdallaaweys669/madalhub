import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND = '#FF7B3F';
const SEARCH_HEIGHT = 52;
const SEARCH_RADIUS = 26;

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  activeFilterCount?: number;
} & Pick<TextInputProps, 'editable' | 'placeholder'>;

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  activeFilterCount = 0,
  editable = true,
  placeholder = 'Find events near you',
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.searchField,
          focused && styles.searchFieldFocused,
        ]}
      >
        <View style={styles.searchIconChip}>
          <Ionicons name="search" size={18} color={BRAND} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A1A1AA"
          style={styles.input}
          editable={editable}
          returnKeyType="search"
          clearButtonMode="while-editing"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      <TouchableOpacity
        onPress={() => onFilterPress?.()}
        style={[
          styles.filterButton,
          hasActiveFilters ? styles.filterButtonActive : styles.filterButtonIdle,
        ]}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={
          hasActiveFilters
            ? `Filters, ${activeFilterCount} active`
            : 'Open filters'
        }
      >
        <Ionicons
          name="options-outline"
          size={17}
          color={hasActiveFilters ? '#FFFFFF' : BRAND}
        />
        <Text
          style={[
            styles.filterLabel,
            hasActiveFilters ? styles.filterLabelActive : styles.filterLabelIdle,
          ]}
        >
          Filters
        </Text>
        {hasActiveFilters ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: SEARCH_HEIGHT,
    borderRadius: SEARCH_RADIUS,
    paddingHorizontal: 8,
    paddingRight: 14,
    backgroundColor: '#FFFBF7',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  searchFieldFocused: {
    borderColor: BRAND,
    backgroundColor: '#FFFFFF',
  },
  searchIconChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    paddingVertical: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SEARCH_HEIGHT,
    borderRadius: SEARCH_RADIUS,
    paddingHorizontal: 14,
    gap: 5,
    borderWidth: 1,
  },
  filterButtonIdle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFEDD5',
  },
  filterButtonActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  filterLabelIdle: {
    color: '#C2410C',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    color: BRAND,
  },
});
