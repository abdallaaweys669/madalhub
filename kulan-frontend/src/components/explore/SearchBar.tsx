import React from 'react';
import {
  StyleSheet,
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
} & Pick<TextInputProps, 'editable' | 'placeholder'>;

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  editable = true,
  placeholder = 'Find events near you',
}: SearchBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.searchField}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A1A1AA"
          style={styles.input}
          editable={editable}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <TouchableOpacity
        onPress={() => onFilterPress?.()}
        style={styles.filterButton}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Filter events"
      >
        <Ionicons name="options-outline" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: SEARCH_HEIGHT,
    borderRadius: SEARCH_RADIUS,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1C1C1E',
    paddingVertical: 0,
  },
  filterButton: {
    width: SEARCH_HEIGHT,
    height: SEARCH_HEIGHT,
    borderRadius: SEARCH_RADIUS,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
