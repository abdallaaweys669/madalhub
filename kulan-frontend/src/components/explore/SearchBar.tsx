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
  placeholder = 'Search events, cities, or topics',
}: SearchBarProps) {
  return (
    <View style={styles.container}>
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
      <TouchableOpacity
        onPress={() => onFilterPress?.()}
        style={styles.filterHit}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Filter events"
      >
        <Ionicons name="options-outline" size={22} color={stylesConst.iconMuted} />
      </TouchableOpacity>
    </View>
  );
}

const stylesConst = {
  iconMuted: '#8E9299',
  placeholder: '#A1A1AA',
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: '#4B5563',
    paddingVertical: 11,
  },
  filterHit: {
    padding: 3,
  },
});
