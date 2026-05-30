import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import EventMetaChipsRow from '@/components/event/EventMetaChipsRow';

function formatDateLabel(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTimeLabel(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function LivePreviewCard({
  title,
  categoryLabel,
  startDate,
  endDate,
  coverUri,
  deliveryMode,
  primary,
  primarySoft,
  primaryBorder,
  textMuted,
  textPrimary,
  formatLabel,
}) {
  const showTitle = Boolean(title?.trim());
  const dateLabel = formatDateLabel(startDate);
  const startTime = formatTimeLabel(startDate);
  const endTime = formatTimeLabel(endDate);
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime;
  return (
    <View style={[styles.wrap, { borderColor: primaryBorder }]}>
      <View style={styles.coverWrap}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="contain" />
        ) : (
          <LinearGradient
            colors={[primarySoft || '#FFEFE5', '#FFDCC4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cover}
          >
            <Text style={[styles.coverPlaceholder, { color: textMuted }]}>Add cover image</Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.body}>
        <EventMetaChipsRow
          variant="detail"
          categoryLabel={categoryLabel?.trim() || undefined}
          formatKey={formatLabel}
          isOnline={deliveryMode === 'online'}
          style={{ marginBottom: 8 }}
        />

        <Text
          style={[
            styles.titleText,
            { color: showTitle ? textPrimary : textMuted, fontStyle: showTitle ? 'normal' : 'italic' },
          ]}
          numberOfLines={2}
        >
          {showTitle ? title.trim() : 'Event title'}
        </Text>

        <View style={styles.metaBlock}>
          {dateLabel ? (
            <View style={styles.metaRow}>
              <Text style={[styles.metaDot, { color: textMuted }]}>·</Text>
              <Text style={[styles.metaText, { color: textMuted }]}>{dateLabel}</Text>
            </View>
          ) : null}
          {timeRange ? (
            <View style={styles.metaRow}>
              <Text style={[styles.metaDot, { color: textMuted }]}>·</Text>
              <Text style={[styles.metaText, { color: textMuted }]}>{timeRange}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#FFF',
  },
  coverWrap: { width: '100%' },
  cover: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  coverPlaceholder: { fontSize: 14, fontWeight: '600' },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  titleText: { fontSize: 18, fontWeight: '800', lineHeight: 24, marginBottom: 8 },
  metaBlock: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDot: { fontSize: 14, fontWeight: '600' },
  metaText: { fontSize: 13, fontWeight: '500' },
});
