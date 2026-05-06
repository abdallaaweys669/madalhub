import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Live preview: 100px cover, title row, meta chips (only when values exist).
 */
export default function LivePreviewCard({
  title,
  categoryLabel,
  startDate,
  coverUri,
  isPhysical,
  primary,
  primarySoft,
  primaryBorder,
  textMuted,
  textPrimary,
}) {
  const showTitle = Boolean(title?.trim());
  const dateChip =
    startDate instanceof Date && !Number.isNaN(startDate.getTime())
      ? startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : null;
  const modeChip = isPhysical ? 'In-person' : 'Online';
  const showCategory = Boolean(categoryLabel?.trim());

  return (
    <View style={[styles.wrap, { borderColor: primaryBorder }]}>
      <View style={styles.coverWrap}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="cover" />
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

      <View style={styles.titleRow}>
        <Text
          style={[
            styles.titleText,
            {
              color: showTitle ? textPrimary : textMuted,
              fontStyle: showTitle ? 'normal' : 'italic',
              fontWeight: showTitle ? '800' : '600',
            },
          ]}
          numberOfLines={2}
        >
          {showTitle ? title.trim() : 'Event title'}
        </Text>
      </View>

      <View style={styles.chipRow}>
        {dateChip ? (
          <View style={[styles.chip, { borderColor: primaryBorder, backgroundColor: primarySoft }]}>
            <Text style={[styles.chipText, { color: textPrimary }]}>{dateChip}</Text>
          </View>
        ) : null}
        <View style={[styles.chip, { borderColor: primaryBorder, backgroundColor: primarySoft }]}>
          <Text style={[styles.chipText, { color: textPrimary }]}>{modeChip}</Text>
        </View>
        {showCategory ? (
          <View style={[styles.chip, { borderColor: primaryBorder, backgroundColor: '#FFF' }]}>
            <Text style={[styles.chipText, { color: primary }]} numberOfLines={1}>
              {categoryLabel.trim()}
            </Text>
          </View>
        ) : null}
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
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholder: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'normal',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
