import React, { useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/loginSignin/authStyles';

export const OTHER_ORGANIZER_TYPE_SLUG = 'other';

const ORANGE = COLORS.primary;
const SELECTED_BG = '#FFF7F3';
const SELECTED_BORDER = ORANGE;
const DEFAULT_BORDER = '#E5E7EB';
const LABEL_COLOR = '#374151';
const SELECTED_LABEL = '#C2410C';
const INPUT_BORDER = 'rgba(255,123,63,0.28)';

/**
 * 2-column grid of selectable organizer type cards.
 * When "Other" is selected, shows a full-width text field below the grid.
 */
export default function OrganizerTypeGrid({
  types,
  selected,
  onSelect,
  loading,
  otherTypeText = '',
  onOtherTypeTextChange,
}) {
  const otherTypeId = useMemo(
    () => types.find((type) => type.slug === OTHER_ORGANIZER_TYPE_SLUG)?.id ?? null,
    [types],
  );
  const isOtherSelected = otherTypeId != null && selected === otherTypeId;

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {types.map((type) => {
          const isSelected = selected === type.id;
          return (
            <Pressable
              key={type.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(type.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={type.name}
            >
              <Ionicons
                name={type.icon || 'ellipsis-horizontal-outline'}
                size={20}
                color={isSelected ? SELECTED_BORDER : '#9CA3AF'}
                style={styles.cardIcon}
              />
              <Text
                style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}
                numberOfLines={3}
              >
                {type.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isOtherSelected ? (
        <View style={styles.otherInputWrap}>
          <Text style={styles.otherLabel}>Please specify *</Text>
          <TextInput
            style={styles.otherInput}
            value={otherTypeText}
            onChangeText={onOtherTypeTextChange}
            placeholder="Describe your organization type"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  loaderWrap: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DEFAULT_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  cardSelected: {
    backgroundColor: SELECTED_BG,
    borderColor: SELECTED_BORDER,
  },
  cardIcon: {
    flexShrink: 0,
  },
  cardLabel: {
    flex: 1,
    fontSize: 13,
    color: LABEL_COLOR,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardLabelSelected: {
    color: SELECTED_LABEL,
    fontWeight: '600',
  },
  otherInputWrap: {
    width: '100%',
    gap: 4,
    marginTop: 2,
  },
  otherLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  otherInput: {
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
});
