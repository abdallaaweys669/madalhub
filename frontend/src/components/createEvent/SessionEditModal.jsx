import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SESSION_FORMAT_OPTIONS } from '@/constants/eventFormats';

function formatTime(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return 'Pick time';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return 'Pick date';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function SessionEditModal({
  visible,
  onClose,
  onSave,
  draft,
  setDraft,
  eventStart,
  eventEnd,
}) {
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState(null);

  useEffect(() => {
    if (!visible) setPicker(null);
  }, [visible]);

  const handlePickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android' && event?.type !== 'set') {
      setPicker(null);
      return;
    }
    if (!selectedDate || !picker) return;

    if (picker.field === 'start') {
      setDraft((d) => ({ ...d, startDatetime: selectedDate }));
    } else {
      setDraft((d) => ({ ...d, endDatetime: selectedDate }));
    }
    if (Platform.OS === 'android') setPicker(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{draft?.key ? 'Edit session' : 'Add session'}</Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Session title</Text>
            <TextInput
              value={draft?.title || ''}
              onChangeText={(title) => setDraft((d) => ({ ...d, title }))}
              placeholder="Opening keynote"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.label}>Session format</Text>
            <View style={styles.chipWrap}>
              {SESSION_FORMAT_OPTIONS.map((item) => {
                const active = draft?.sessionFormat === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setDraft((d) => ({ ...d, sessionFormat: item.key }))}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Starts</Text>
            <Pressable onPress={() => setPicker({ field: 'start', mode: 'datetime' })} style={styles.dateBtn}>
              <Text style={styles.dateText}>
                {formatDate(draft?.startDatetime)} · {formatTime(draft?.startDatetime)}
              </Text>
            </Pressable>

            <Text style={styles.label}>Ends</Text>
            <Pressable onPress={() => setPicker({ field: 'end', mode: 'datetime' })} style={styles.dateBtn}>
              <Text style={styles.dateText}>
                {formatDate(draft?.endDatetime)} · {formatTime(draft?.endDatetime)}
              </Text>
            </Pressable>

            <Text style={styles.label}>Speakers (optional)</Text>
            <TextInput
              value={draft?.speakerNames || ''}
              onChangeText={(speakerNames) => setDraft((d) => ({ ...d, speakerNames }))}
              placeholder="Names separated by commas"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              value={draft?.description || ''}
              onChangeText={(description) => setDraft((d) => ({ ...d, description }))}
              placeholder="What happens in this session?"
              placeholderTextColor="#9CA3AF"
              multiline
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            />
          </ScrollView>

          {picker ? (
            <DateTimePicker
              value={
                picker.field === 'start'
                  ? draft?.startDatetime || eventStart || new Date()
                  : draft?.endDatetime || eventEnd || new Date()
              }
              mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
            />
          ) : null}

          <Pressable onPress={onSave} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save session</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.42)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: '92%',
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#FF7A00', backgroundColor: '#FFF7ED' },
  chipText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#C2410C' },
  dateBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  dateText: { color: '#111827' },
  saveBtn: {
    marginTop: 12,
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
