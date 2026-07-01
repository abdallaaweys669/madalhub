import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatOrganizerDate,
  organizerEventStatusChip,
  resolveOrganizerEventCoverUrl,
} from '@/features/organizer/utils/organizerEventUtils';

function ActionButton({ icon, label, onPress, accent }) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      <Ionicons name={icon} size={16} color={accent ? '#EA580C' : '#475569'} />
      <Text style={[styles.actionText, accent && styles.actionTextAccent]}>{label}</Text>
    </Pressable>
  );
}

function MetaPill({ icon, label }) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={13} color="#64748B" />
      <Text style={styles.metaPillText}>{label}</Text>
    </View>
  );
}

export default function OrganizerEventListCard({
  event,
  onEdit,
  onManage,
  onPreview,
  onPublish,
  onUnarchive,
  onMenuPress,
}) {
  const chip = organizerEventStatusChip(event);
  const coverUrl = resolveOrganizerEventCoverUrl(event);
  const isPublished = event.status === 'published';
  const isArchived = event.status === 'cancelled';
  const isFree = Number(event.totalPrice) <= 0;

  return (
    <View style={styles.card}>
      <View style={styles.coverWrap}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Ionicons name="image-outline" size={32} color="#FF7B3F" />
          </View>
        )}

        <Pressable
          onPress={onMenuPress}
          hitSlop={8}
          style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityLabel="Event options"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#0F172A" />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.chip, { backgroundColor: chip.bg }]}>
            <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
            <Text style={styles.dateText}>{formatOrganizerDate(event.startsAt) || 'No date'}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {event.title?.trim() || 'Untitled event'}
        </Text>

        <View style={styles.metaRow}>
          <MetaPill
            icon={event.isPhysical ? 'person-outline' : 'globe-outline'}
            label={event.isPhysical ? 'In-person' : 'Online'}
          />
          <MetaPill icon="pricetag-outline" label={isFree ? 'Free' : `$${event.totalPrice}`} />
        </View>

        <View style={styles.actionsRow}>
          <ActionButton icon="create-outline" label="Edit" onPress={onEdit} />
          <View style={styles.divider} />
          {isArchived ? (
            <>
              <ActionButton icon="arrow-undo-outline" label="Unarchive" onPress={onUnarchive} accent />
              <View style={styles.divider} />
              <ActionButton icon="eye-outline" label="Preview" onPress={onEdit} />
            </>
          ) : isPublished ? (
            <>
              <ActionButton icon="settings-outline" label="Manage" onPress={onManage} accent />
              <View style={styles.divider} />
              <ActionButton icon="eye-outline" label="Preview" onPress={onPreview} />
            </>
          ) : (
            <>
              <ActionButton icon="rocket-outline" label="Publish" onPress={onPublish} accent />
              <View style={styles.divider} />
              <ActionButton icon="eye-outline" label="Preview" onPress={onEdit} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  coverWrap: {
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: 168,
  },
  coverFallback: {
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  body: {
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  actionTextAccent: {
    color: '#EA580C',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
});
