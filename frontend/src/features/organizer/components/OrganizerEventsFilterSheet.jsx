import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EVENT_FORMAT_OPTIONS } from '@/constants/eventFormats';
import {
  EMPTY_EVENT_FILTERS,
  EVENT_DATE_FILTER_OPTIONS,
  EVENT_PRICING_FILTER_OPTIONS,
  EVENT_STATUS_FILTER_OPTIONS,
} from '@/features/organizer/utils/organizerEventsFilters';

function FilterSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function OptionChip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function OrganizerEventsFilterSheet({
  visible,
  value = EMPTY_EVENT_FILTERS,
  categories = [],
  onChange,
  onClose,
  onReset,
}) {
  const setField = (field, next) => onChange?.({ ...value, [field]: next });

  const eventTypeOptions = [
    { id: 'all', label: 'Any type' },
    ...EVENT_FORMAT_OPTIONS.map((option) => ({ id: option.key, label: option.label })),
  ];

  const categoryOptions = [
    { id: 'all', label: 'Any category' },
    ...categories.map((cat) => ({ id: String(cat.id), label: cat.name })),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Filter events</Text>
            <Pressable onPress={onReset} hitSlop={8}>
              <Text style={styles.reset}>Reset</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <FilterSection title="Status">
              <View style={styles.chipRow}>
                {EVENT_STATUS_FILTER_OPTIONS.map((option) => (
                  <OptionChip
                    key={option.id}
                    label={option.label}
                    selected={value.status === option.id}
                    onPress={() => setField('status', option.id)}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Event type">
              <View style={styles.chipRow}>
                {eventTypeOptions.map((option) => (
                  <OptionChip
                    key={option.id}
                    label={option.label}
                    selected={value.eventType === option.id}
                    onPress={() => setField('eventType', option.id)}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Date">
              <View style={styles.chipRow}>
                {EVENT_DATE_FILTER_OPTIONS.map((option) => (
                  <OptionChip
                    key={option.id}
                    label={option.label}
                    selected={value.date === option.id}
                    onPress={() => setField('date', option.id)}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Category">
              <View style={styles.chipRow}>
                {categoryOptions.map((option) => (
                  <OptionChip
                    key={option.id}
                    label={option.label}
                    selected={value.categoryId === option.id}
                    onPress={() => setField('categoryId', option.id)}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Free / Paid">
              <View style={styles.chipRow}>
                {EVENT_PRICING_FILTER_OPTIONS.map((option) => (
                  <OptionChip
                    key={option.id}
                    label={option.label}
                    selected={value.pricing === option.id}
                    onPress={() => setField('pricing', option.id)}
                  />
                ))}
              </View>
            </FilterSection>
          </ScrollView>

          <Pressable onPress={onClose} style={styles.applyBtn}>
            <Text style={styles.applyText}>Show results</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </Pressable>
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
    maxHeight: '88%',
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  reset: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF7B3F',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#C2410C',
  },
  applyBtn: {
    marginHorizontal: 18,
    marginTop: 4,
    backgroundColor: '#FF7B3F',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  applyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
