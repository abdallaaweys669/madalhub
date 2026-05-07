import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

function formatDateLabel(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTimeLabel(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const FORMAT_LABELS = {
  talk: 'Talk',
  panel: 'Panel',
  meetup: 'Meetup',
  seminar: 'Seminar',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
};

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
  const modeLabel = deliveryMode === 'online' ? 'ONLINE' : 'IN-PERSON';
  const showCategory = Boolean(categoryLabel?.trim());
  const formatDisp = formatLabel ? FORMAT_LABELS[formatLabel] || formatLabel : null;

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
        <View style={styles.tagRow}>
          {showCategory ? (
            <View style={[styles.tag, { backgroundColor: '#FFF7ED' }]}>
              <Text style={[styles.tagLabel, { color: '#EA580C' }]}>{categoryLabel}</Text>
            </View>
          ) : null}
          <View style={[styles.tag, { backgroundColor: deliveryMode === 'online' ? '#EFF6FF' : '#FEF3C7' }]}>
            <Text
              style={[styles.tagLabel, { color: deliveryMode === 'online' ? '#1D4ED8' : '#92400E' }]}
            >
              {modeLabel}
            </Text>
          </View>
          {formatDisp ? (
            <View style={[styles.tag, { backgroundColor: primarySoft }]}>
              <Text style={[styles.tagLabel, { color: primary }]}>{formatDisp}</Text>
            </View>
          ) : null}
        </View>

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
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  titleText: { fontSize: 18, fontWeight: '800', lineHeight: 24, marginBottom: 8 },
  metaBlock: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDot: { fontSize: 14, fontWeight: '600' },
  metaText: { fontSize: 13, fontWeight: '500' },
});
