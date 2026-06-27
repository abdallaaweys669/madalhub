import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { NO_PROOF_SLUG, ALLOWED_DOC_EXTENSIONS, MAX_DOC_SIZE_MB, NO_PROOF_OPTION_LABEL } from '../constants/verificationCopy';

const ORANGE = COLORS.primary;
const SELECTED_BG = '#FFF7F3';
const SELECTED_BORDER = ORANGE;
const SELECTED_LABEL = '#C2410C';
const DEFAULT_BORDER = '#E5E7EB';
const NONE_BORDER = '#D1D5DB';

const NO_PROOF_TYPE = {
  id: NO_PROOF_SLUG,
  slug: NO_PROOF_SLUG,
  name: NO_PROOF_OPTION_LABEL,
  icon: 'close-circle-outline',
};

/**
 * List of selectable document types + "no proof" fallback.
 */
export default function DocumentTypeGrid({ types, selected, onSelect, loading }) {
  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }

  const all = [...types, NO_PROOF_TYPE];

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Accepted: {ALLOWED_DOC_EXTENSIONS} · max {MAX_DOC_SIZE_MB} MB · 1 file
      </Text>
      {all.map((type) => {
        const isSelected = selected === type.slug || selected === type.id;
        const isNone = type.slug === NO_PROOF_SLUG;
        return (
          <Pressable
            key={type.id ?? type.slug}
            style={[
              styles.row,
              isSelected && (isNone ? styles.rowNoneSelected : styles.rowSelected),
            ]}
            onPress={() => onSelect(isNone ? NO_PROOF_SLUG : type.slug)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
          >
            <View
              style={[
                styles.radio,
                isSelected && (isNone ? styles.radioNone : styles.radioSelected),
              ]}
            >
              {isSelected ? (
                <View style={[styles.radioDot, isNone && styles.radioDotNone]} />
              ) : null}
            </View>
            <Ionicons
              name={type.icon || 'document-outline'}
              size={18}
              color={isSelected ? (isNone ? '#6B7280' : SELECTED_BORDER) : '#9CA3AF'}
              style={styles.rowIcon}
            />
            <Text style={[styles.rowLabel, isSelected && !isNone && styles.rowLabelSelected]}>
              {type.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    gap: 8,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: DEFAULT_BORDER,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  rowSelected: {
    backgroundColor: SELECTED_BG,
    borderColor: SELECTED_BORDER,
  },
  rowNoneSelected: {
    backgroundColor: '#F9FAFB',
    borderColor: NONE_BORDER,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: DEFAULT_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: SELECTED_BORDER,
  },
  radioNone: {
    borderColor: '#9CA3AF',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SELECTED_BORDER,
  },
  radioDotNone: {
    backgroundColor: '#9CA3AF',
  },
  rowIcon: {
    width: 22,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  rowLabelSelected: {
    color: SELECTED_LABEL,
    fontWeight: '600',
  },
});
