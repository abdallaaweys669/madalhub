import React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  placeholder = "Find what's happening near you",
}: SearchBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.searchField}>
        <Ionicons name="search-outline" size={20} color={stylesConst.iconMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={stylesConst.placeholder}
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

const stylesConst = {
  iconMuted: '#8E9299',
  placeholder: '#A1A1AA',
};

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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#EEF0F2',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1C1C1E',
    paddingVertical: 9,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FF7B3F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
});
