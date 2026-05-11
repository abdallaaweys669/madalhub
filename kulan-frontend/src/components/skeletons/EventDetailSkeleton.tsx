import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

import Skeleton, { SkeletonPiece } from '@/components/Skeleton';
import { spacing } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

/** Matches `EventHeader` / `headerWrapper` */
const HEADER_H = 260;
const CONTENT_PAD_H = 20;
const INNER_W = SCREEN_W - CONTENT_PAD_H * 2;

export default function EventDetailSkeleton() {
  const chipW = Math.min(92, Math.round((INNER_W - 16) / 3));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Skeleton containerStyle={styles.headerSkeleton}>
        <SkeletonPiece width={SCREEN_W} height={HEADER_H} style={styles.headerImage} />
      </Skeleton>

      <View style={styles.body}>
        <Skeleton containerStyle={styles.chipsRow}>
          <View style={styles.chipsInner}>
            <SkeletonPiece width={chipW} height={28} style={styles.chip} />
            <SkeletonPiece width={chipW} height={28} style={styles.chip} />
            <SkeletonPiece width={chipW} height={28} style={styles.chip} />
          </View>
        </Skeleton>

        <Skeleton containerStyle={styles.block}>
          <SkeletonPiece width={Math.round(INNER_W * 0.92)} height={26} style={styles.mb10} />
          <SkeletonPiece width={Math.round(INNER_W * 0.52)} height={26} style={styles.mb14} />
          <SkeletonPiece width="100%" height={14} style={styles.mb8} />
          <SkeletonPiece width="100%" height={14} style={styles.mb8} />
          <SkeletonPiece width={Math.round(INNER_W * 0.72)} height={14} />
        </Skeleton>

        <View style={styles.infoSpacing} />

        <View style={styles.infoRow}>
          <Skeleton containerStyle={styles.iconBg}>
            <SkeletonPiece width={18} height={18} style={styles.iconPiece} />
          </Skeleton>
          <View style={styles.infoTextCol}>
            <SkeletonPiece width={Math.round(INNER_W * 0.62)} height={15} style={styles.mb6} />
            <SkeletonPiece width={Math.round(INNER_W * 0.42)} height={14} />
          </View>
        </View>

        <View style={styles.infoRow}>
          <Skeleton containerStyle={styles.iconBg}>
            <SkeletonPiece width={18} height={18} style={styles.iconPiece} />
          </Skeleton>
          <View style={styles.infoTextCol}>
            <SkeletonPiece width={Math.round(INNER_W * 0.78)} height={15} />
          </View>
        </View>

        <SkeletonPiece width={132} height={18} style={styles.sectionTitle} />

        <Skeleton containerStyle={styles.orgCard}>
          <SkeletonPiece width={48} height={48} style={styles.orgAvatar} />
          <View style={styles.orgLines}>
            <SkeletonPiece width={Math.round(INNER_W - 72)} height={16} style={styles.mb8} />
            <SkeletonPiece width={Math.round((INNER_W - 72) * 0.65)} height={13} />
          </View>
        </Skeleton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: spacing.xl + 56,
  },
  headerSkeleton: {
    backgroundColor: 'transparent',
    alignSelf: 'stretch',
  },
  headerImage: {
    borderRadius: 0,
  },
  body: {
    paddingHorizontal: CONTENT_PAD_H,
    paddingTop: 14,
  },
  chipsRow: {
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  chipsInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 999,
  },
  block: {
    backgroundColor: 'transparent',
  },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb14: { marginBottom: 14 },
  infoSpacing: {
    height: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBg: {
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  iconPiece: {
    borderRadius: 4,
  },
  infoTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 6,
  },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'transparent',
    gap: 12,
  },
  orgAvatar: {
    borderRadius: 12,
  },
  orgLines: {
    flex: 1,
    minWidth: 0,
  },
});
