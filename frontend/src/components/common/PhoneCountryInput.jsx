import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/loginSignin/authStyles';
import {
  findCountryByDialCode,
  formatPhoneValue,
  parsePhoneValue,
  searchCountries,
} from '@/constants/countryCallingCodes';

const INPUT_BORDER = 'rgba(255,123,63,0.28)';

/**
 * Split phone input: country code (+ flag picker) + national number.
 * Emits E.164-style value via onChange, e.g. +252612345678.
 */
export default function PhoneCountryInput({
  value = '',
  onChange,
  placeholder = '612 345 678',
}) {
  const initial = useMemo(() => parsePhoneValue(value), []);
  const [country, setCountry] = useState(initial.country);
  const [dialCode, setDialCode] = useState(initial.dialCode);
  const [nationalNumber, setNationalNumber] = useState(initial.nationalNumber);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const parsed = parsePhoneValue(value);
    const formatted = formatPhoneValue(dialCode, nationalNumber);
    if (formatted === String(value || '').trim()) return;

    setCountry(parsed.country);
    setDialCode(parsed.dialCode);
    setNationalNumber(parsed.nationalNumber);
  }, [value]);

  const emitChange = (nextDialCode, nextNational, nextCountry) => {
    onChange?.(formatPhoneValue(nextDialCode, nextNational), {
      dialCode: nextDialCode,
      nationalNumber: nextNational,
      country: nextCountry,
    });
  };

  const handleDialCodeChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    const matched = findCountryByDialCode(digits);

    setDialCode(digits);
    if (matched) setCountry(matched);
    emitChange(digits, nationalNumber, matched ?? country);
  };

  const handleNationalChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 15);
    setNationalNumber(digits);
    emitChange(dialCode, digits, country);
  };

  const handleSelectCountry = (item) => {
    setCountry(item);
    setDialCode(item.dialCode);
    setPickerOpen(false);
    setSearch('');
    emitChange(item.dialCode, nationalNumber, item);
  };

  const filteredCountries = useMemo(() => searchCountries(search), [search]);

  return (
    <>
      <View style={styles.row}>
        <View style={styles.codeBox}>
          <Pressable
            style={styles.flagBtn}
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Country ${country.name}, dial code plus ${country.dialCode}`}
          >
            <Text style={styles.flag}>{country.flag}</Text>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </Pressable>
          <Text style={styles.plusPrefix}>+</Text>
          <TextInput
            style={styles.codeInput}
            value={dialCode}
            onChangeText={handleDialCodeChange}
            placeholder="252"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <TextInput
          style={styles.numberInput}
          value={nationalNumber}
          onChangeText={handleNationalChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      </View>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setPickerOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select country</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search country or code (e.g. Somalia, 252)"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.iso}
              keyboardShouldPersistTaps="handled"
              style={styles.countryList}
              renderItem={({ item }) => {
                const selected = item.iso === country.iso;
                return (
                  <Pressable
                    style={[styles.countryRow, selected && styles.countryRowSelected]}
                    onPress={() => handleSelectCountry(item)}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={styles.countryName}>{item.name}</Text>
                    <Text style={styles.countryCode}>+{item.dialCode}</Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No countries found</Text>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingLeft: 6,
    paddingRight: 8,
    minWidth: 128,
    maxWidth: 148,
  },
  flagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  flag: {
    fontSize: 22,
    lineHeight: 26,
  },
  plusPrefix: {
    fontSize: 15,
    color: '#6B7280',
    marginRight: 2,
  },
  codeInput: {
    flex: 1,
    minWidth: 36,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 12,
    paddingRight: 4,
  },
  numberInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalDismiss: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '78%',
    paddingBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  countryList: {
    paddingHorizontal: 12,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  countryRowSelected: {
    backgroundColor: '#FFF7F3',
  },
  countryFlag: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  countryCode: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    paddingVertical: 24,
  },
});
