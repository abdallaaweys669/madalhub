import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const OPTIONS = [
  {
    key: 'going',
    icon: 'check-circle',
    title: "I'm going",
    subtitle: 'Keep my spot at this event',
    iconColor: '#16A34A',
    selectedBorder: '#FF7B3F',
    selectedBg: '#FFF7ED',
    selectedIconBg: '#DCFCE7',
  },
  {
    key: 'not_going',
    icon: 'x-circle',
    title: "Can't make it",
    subtitle: 'Cancel my registration',
    iconColor: '#64748B',
    selectedBorder: '#CBD5E1',
    selectedBg: '#F8FAFC',
    selectedIconBg: '#F1F5F9',
  },
];

export default function EditAttendanceSheet({ visible, isGoing, onClose, onUpdate }) {
  const insets = useSafeAreaInsets();
  const initialChoice = isGoing ? 'going' : 'not_going';
  const [choice, setChoice] = useState(initialChoice);

  useEffect(() => {
    if (visible) {
      setChoice(isGoing ? 'going' : 'not_going');
    }
  }, [visible, isGoing]);

  const isDirty = choice !== initialChoice;

  const handleSave = () => {
    if (!isDirty) {
      onClose?.();
      return;
    }
    onUpdate?.(choice === 'going');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Edit attendance</Text>
              <View style={styles.titleAccent} />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Let the organizer know if your plans changed.</Text>

          <View style={styles.options}>
            {OPTIONS.map((option) => {
              const selected = choice === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.option,
                    selected && {
                      borderColor: option.selectedBorder,
                      backgroundColor: option.selectedBg,
                    },
                  ]}
                  onPress={() => setChoice(option.key)}
                  activeOpacity={0.88}
                >
                  <View
                    style={[
                      styles.optionIconWrap,
                      selected && { backgroundColor: option.selectedIconBg },
                    ]}
                  >
                    <Feather
                      name={option.icon}
                      size={20}
                      color={selected ? option.iconColor : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  <View style={[styles.tick, selected && styles.tickSelected]}>
                    {selected ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, !isDirty && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.92}
            disabled={!isDirty}
          >
            {isDirty ? (
              <LinearGradient
                colors={['#FF7A00', '#FF9A3D']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.saveGradient}
              >
                <Text style={styles.saveBtnText}>
                  {choice === 'going' ? 'Confirm attendance' : 'Cancel registration'}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.saveGradient}>
                <Text style={styles.saveBtnTextMuted}>No changes</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  titleAccent: {
    marginTop: 6,
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FF7B3F',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 18,
  },
  options: {
    gap: 10,
    marginBottom: 18,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  optionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickSelected: {
    borderColor: '#FF7B3F',
    backgroundColor: '#FF7B3F',
  },
  saveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveGradient: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F1F5F9',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  saveBtnTextMuted: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
});
