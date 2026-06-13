import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { SkeletonPiece } from '@/components/Skeleton';
import { spacing } from '@/theme';

const MY_EVENT_CARD_PEEK = 52;

export default function HomeSkeleton() {
  const { width: screenWidth } = useWindowDimensions();
  const myEventCardWidth = Math.floor(screenWidth - spacing.md * 2 - MY_EVENT_CARD_PEEK);

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.myEventsRow}
      >
        <SkeletonPiece width={myEventCardWidth} height={186} style={styles.cardImage} />
        <SkeletonPiece width={myEventCardWidth * 0.28} height={186} style={styles.cardImage} />
      </ScrollView>

      <View style={styles.section}>
        <View style={styles.recommendedHeadSkeleton}>
          <SkeletonPiece width={210} height={24} style={styles.bone} />
          <SkeletonPiece width={52} height={14} style={styles.bone} />
        </View>
        {[0, 1].map((i) => (
          <View key={i} style={styles.recommendedRow}>
            <SkeletonPiece width={92} height={92} style={styles.recommendedImage} />
            <View style={styles.recommendedCopy}>
              <View style={styles.recommendedTitleSkeleton}>
                <SkeletonPiece width="72%" height={16} style={styles.bone} />
                <View style={styles.recommendedIconsSkeleton}>
                  <SkeletonPiece width={34} height={34} style={styles.recommendedActionBone} />
                  <SkeletonPiece width={34} height={34} style={styles.recommendedActionBone} />
                </View>
              </View>
              <SkeletonPiece width="88%" height={12} style={styles.mb8} />
              <SkeletonPiece width="76%" height={12} style={styles.mb8} />
              <View style={styles.recommendedFooterSkeleton}>
                <SkeletonPiece width={40} height={14} style={styles.bone} />
                <SkeletonPiece width={72} height={22} style={styles.bone} />
              </View>
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
  myEventsRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
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
  recommendedImage: {
    borderRadius: 10,
    flexShrink: 0,
  },
  recommendedCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  recommendedTitleSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  recommendedIconsSkeleton: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  recommendedActionBone: {
    borderRadius: 17,
  },
  recommendedFooterSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
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
