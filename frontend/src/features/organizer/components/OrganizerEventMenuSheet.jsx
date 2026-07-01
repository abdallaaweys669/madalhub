import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_ITEMS = [
  { id: 'duplicate', label: 'Duplicate', icon: 'copy-outline', color: '#0F172A' },
  { id: 'share', label: 'Share', icon: 'share-social-outline', color: '#0F172A' },
  { id: 'archive', label: 'Archive', icon: 'archive-outline', color: '#0F172A' },
  { id: 'delete', label: 'Delete', icon: 'trash-outline', color: '#DC2626', destructive: true },
];

const ARCHIVED_ITEMS = [
  { id: 'unarchive', label: 'Unarchive', icon: 'arrow-undo-outline', color: '#0F172A' },
  { id: 'duplicate', label: 'Duplicate', icon: 'copy-outline', color: '#0F172A' },
  { id: 'share', label: 'Share', icon: 'share-social-outline', color: '#0F172A' },
  { id: 'delete', label: 'Delete', icon: 'trash-outline', color: '#DC2626', destructive: true },
];

export default function OrganizerEventMenuSheet({ visible, eventTitle, isArchived = false, onClose, onSelect }) {
  const items = useMemo(() => (isArchived ? ARCHIVED_ITEMS : ACTIVE_ITEMS), [isArchived]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title} numberOfLines={2}>
            {eventTitle || 'Event options'}
          </Text>
          {items.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => onSelect?.(item.id)}
              style={({ pressed }) => [
                styles.row,
                index < items.length - 1 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
            >
              <Ionicons name={item.icon} size={20} color={item.color} />
              <Text style={[styles.rowText, item.destructive && styles.rowTextDestructive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowPressed: {
    backgroundColor: '#F8FAFC',
  },
  rowText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowTextDestructive: {
    color: '#DC2626',
  },
});
