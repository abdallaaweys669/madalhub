import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function EditAttendanceSheet({ visible, isGoing, onClose, onUpdate }) {
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState(isGoing ? 'going' : 'not_going');

  useEffect(() => {
    if (visible) {
      setChoice(isGoing ? 'going' : 'not_going');
    }
  }, [visible, isGoing]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Update attendance</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.option, choice === 'going' && styles.optionSelected]}
            onPress={() => setChoice('going')}
            activeOpacity={0.9}
          >
            <View style={[styles.radio, choice === 'going' && styles.radioSelected]}>
              {choice === 'going' ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.optionLabel}>Going</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, choice === 'not_going' && styles.optionSelected]}
            onPress={() => setChoice('not_going')}
            activeOpacity={0.9}
          >
            <View style={[styles.radio, choice === 'not_going' && styles.radioSelected]}>
              {choice === 'not_going' ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.optionLabel}>Not going</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() => onUpdate?.(choice === 'going')}
            activeOpacity={0.9}
          >
            <Text style={styles.updateBtnText}>Update</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: '#FF7B3F',
    backgroundColor: '#FFF7ED',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#FF7B3F',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF7B3F',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  updateBtn: {
    marginTop: 8,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
