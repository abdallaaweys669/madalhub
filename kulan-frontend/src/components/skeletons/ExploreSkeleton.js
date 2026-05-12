import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

import Skeleton, { SkeletonPiece } from '@/components/Skeleton';
import { spacing } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

/** Matches `ExploreEventCard`: content left + thumbnail right. */
const CARD_RADIUS = 18;
const PAD_H = 16;
const CARD_W = SCREEN_W - PAD_H * 2;
const THUMB_W = 108;
const THUMB_H = 96;

/**
 * Explore loading: search bar + 3 tab chips + vertical cards matching home skeleton style.
 */
export default function ExploreSkeleton() {
  const tabWidths = useMemo(() => {
    const gutter = PAD_H * 2;
    const gaps = spacing.sm * 2;
    const slot = (SCREEN_W - gutter - gaps) / 3;
    return [slot, slot, slot];
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <View style={styles.pad}>
        <Skeleton containerStyle={styles.searchShell}>
          <View style={styles.searchRow}>
            <SkeletonPiece width={20} height={20} style={styles.round6} />
            <View style={styles.searchMidWrap}>
              <SkeletonPiece width="100%" height={15} style={styles.round6} />
            </View>
            <SkeletonPiece width={22} height={22} style={styles.round6} />
          </View>
        </Skeleton>

        <View style={styles.sectionSpacer} />

        <View style={styles.tabsRow}>
          {tabWidths.map((tw, i) => (
            <SkeletonPiece key={i} width={tw} height={40} style={styles.tabPiece} />
          ))}
        </View>

        <View style={styles.sectionSpacer} />
      </View>

      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} containerStyle={styles.cardWrap}>
          <View style={styles.topRow}>
            <View style={styles.textColumn}>
              <SkeletonPiece width="90%" height={18} style={styles.mb8} />
              <SkeletonPiece width="66%" height={18} style={styles.mb10} />
              <View style={styles.chipRow}>
                <SkeletonPiece width={72} height={24} style={styles.pill} />
                <SkeletonPiece width={86} height={24} style={styles.pill} />
              </View>
              <SkeletonPiece width="72%" height={13} style={styles.mb8} />
              <SkeletonPiece width="84%" height={13} />
            </View>
            <SkeletonPiece width={THUMB_W} height={THUMB_H} style={styles.thumbnail} />
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.bottomLeft}>
              <View style={styles.avatarStack}>
                {[0, 1, 2].map((j) => (
                  <View key={j} style={[styles.avatarBone, j > 0 && styles.avatarOverlap]}>
                    <SkeletonPiece width={22} height={22} style={styles.avatarPiece} />
                  </View>
                ))}
              </View>
              <SkeletonPiece width={72} height={13} style={styles.ml8} />
              <SkeletonPiece width={82} height={22} style={styles.modeTag} />
            </View>
            <View style={styles.actions}>
              <SkeletonPiece width={30} height={30} style={styles.iconBtn} />
              <SkeletonPiece width={30} height={30} style={styles.iconBtn} />
            </View>
          </View>
        </Skeleton>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  pad: {
    paddingHorizontal: PAD_H,
    paddingTop: 8,
  },
  sectionSpacer: {
    height: 14,
  },
  searchShell: {
    borderRadius: 16,
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  searchMidWrap: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    minWidth: 0,
  },
  round6: {
    borderRadius: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabPiece: {
    borderRadius: 14,
  },
  cardWrap: {
    alignSelf: 'center',
    width: CARD_W,
    marginBottom: spacing.md,
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: 14,
    minHeight: THUMB_H,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  pill: {
    borderRadius: 999,
  },
  thumbnail: {
    borderRadius: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ml8: {
    marginLeft: 8,
  },
  modeTag: {
    borderRadius: 999,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 6,
  },
  iconBtn: {
    borderRadius: 15,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBone: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 13,
    overflow: 'hidden',
  },
  avatarPiece: {
    borderRadius: 11,
  },
  avatarOverlap: {
    marginLeft: -9,
  },
});
