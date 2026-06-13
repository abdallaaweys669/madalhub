import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EVENT_TEMPLATES } from '@/features/createEvent/templates';

/** Horizontal template chips; `onSelect` receives an entry from EVENT_TEMPLATES. */
export default function TemplatePicker({ primary, onSelect }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Start from a template</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {EVENT_TEMPLATES.map((t) => (
          <Pressable key={t.id} onPress={() => onSelect(t)} style={[styles.chip, { borderColor: '#E7E9F1' }]}>
            <Ionicons name={t.icon} size={18} color={primary} />
            <Text style={styles.chipText}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#596175', marginBottom: 10 },
  row: { gap: 10, paddingRight: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFF',
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: '#12131A' },
});
