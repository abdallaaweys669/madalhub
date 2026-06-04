import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SkeletonPiece } from '@/components/Skeleton';
import { spacing } from '@/theme';

export default function HomeSkeleton() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <SkeletonPiece width={120} height={12} style={styles.mb8} />
        <SkeletonPiece width={180} height={24} style={styles.mb8} />
        <SkeletonPiece width={150} height={14} style={styles.bone} />
      </View>

      <View style={styles.section}>
        <SkeletonPiece width={120} height={28} style={styles.sectionTitle} />
        <View style={styles.tabsRow}>
          {[92, 88, 84, 76].map((tw, i) => (
            <SkeletonPiece key={i} width={tw} height={42} style={styles.tabPiece} />
          ))}
        </View>
      </View>

      <View style={styles.myEventsCardWrap}>
        <SkeletonPiece width="100%" height={186} style={styles.cardImage} />
      </View>

      <View style={styles.section}>
        <View style={styles.recommendedHeadSkeleton}>
          <SkeletonPiece width={210} height={24} style={styles.bone} />
          <SkeletonPiece width={52} height={14} style={styles.bone} />
        </View>
        {[0, 1].map((i) => (
          <View key={i} style={styles.recommendedRow}>
            <View style={styles.recommendedLeftSkeleton}>
              <SkeletonPiece width={145} height={95} style={styles.recommendedImage} />
              <View style={styles.recommendedActionsSkeleton}>
                <SkeletonPiece width={52} height={12} style={styles.bone} />
                <SkeletonPiece width={48} height={12} style={styles.bone} />
              </View>
            </View>
            <View style={styles.recommendedCopy}>
              <SkeletonPiece width={72} height={18} style={styles.mb8} />
              <SkeletonPiece width="92%" height={16} style={styles.mb8} />
              <SkeletonPiece width="78%" height={12} style={styles.mb8} />
              <SkeletonPiece width="62%" height={12} style={styles.mb8} />
              <SkeletonPiece width="70%" height={12} style={styles.bone} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <SkeletonPiece width={200} height={24} style={styles.sectionTitle} />
        <SkeletonPiece width="100%" height={188} style={styles.popularHero} />
      </View>

      <View style={styles.section}>
        <SkeletonPiece width={170} height={30} style={styles.sectionTitle} />
        <View style={styles.discoverRow}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.discoverCard}>
              <SkeletonPiece width={208} height={126} style={styles.discoverImage} />
              <View style={styles.discoverCopy}>
                <SkeletonPiece width={170} height={14} style={styles.mb8} />
                <SkeletonPiece width={120} height={12} style={styles.bone} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  mb8: { marginBottom: 8 },
  bone: {},
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sectionTitle: { marginBottom: spacing.sm },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabPiece: {
    borderRadius: 14,
  },
  myEventsCardWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  cardImage: {
    borderRadius: 14,
  },
  recommendedHeadSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  recommendedRow: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendedLeftSkeleton: {
    width: 145,
    flexShrink: 0,
    gap: 10,
  },
  recommendedActionsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  recommendedImage: {
    borderRadius: 12,
  },
  recommendedCopy: {
    flex: 1,
    minWidth: 0,
  },
  popularHero: {
    borderRadius: 18,
  },
  discoverRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  discoverCard: {
    width: 208,
  },
  discoverImage: {
    borderRadius: 12,
  },
  discoverCopy: {
    marginTop: 8,
  },
});
