import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/features/onboarding/tokens/colors';

export default function DateInput({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  format = 'MDY',
}) {
  const [show, setShow] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    if (format === 'DMY') return `${dd} / ${mm} / ${yyyy}`;
    if (format === 'YMD') return `${yyyy}-${mm}-${dd}`;
    return `${mm} / ${dd} / ${yyyy}`;
  };

  const handleChange = (event, date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event?.type === 'dismissed') return;
    if (date) onChange(date);
  };

  return (
    <View>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => setShow(true)}
        style={styles.input}
        accessibilityRole="button"
        accessibilityLabel={label || 'Select date'}
      >
        <Text style={styles.inputText}>{formatDate(value)}</Text>
  <MaterialIcons name="calendar-today" size={20} color={colors.subtext} />
      </Pressable>

      {show && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
            onChange={handleChange}
            maximumDate={maxDate}
            minimumDate={minDate}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8, color: colors.text, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  pickerContainer: { marginTop: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.bg },
});
