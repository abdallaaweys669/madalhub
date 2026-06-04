import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

import Skeleton, { SkeletonPiece } from '@/components/Skeleton';
import { spacing } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const PAD_H = 16;
const CARD_W = SCREEN_W - PAD_H * 2;
const HERO_H = 200;

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
        <View style={styles.searchRow}>
          <Skeleton containerStyle={styles.searchShell}>
            <View style={styles.searchInner}>
              <SkeletonPiece width={20} height={20} style={styles.round6} />
              <View style={styles.searchMidWrap}>
                <SkeletonPiece width="100%" height={15} style={styles.round6} />
              </View>
            </View>
          </Skeleton>
          <SkeletonPiece width={44} height={44} style={styles.filterBone} />
        </View>

        <View style={styles.sectionSpacer} />

        <View style={styles.tabsRow}>
          {tabWidths.map((tw, i) => (
            <SkeletonPiece key={i} width={tw} height={32} style={styles.tabPiece} />
          ))}
        </View>

        <View style={styles.sectionSpacer} />
        <SkeletonPiece width={100} height={18} style={styles.sectionTitleBone} />
        <View style={styles.sectionSpacer} />
      </View>

      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.cardWrap}>
          <SkeletonPiece width={CARD_W} height={HERO_H} style={styles.heroBone} />
          <View style={styles.body}>
            <View style={styles.chipRowBone}>
              <SkeletonPiece width={88} height={28} style={styles.chipBone} />
              <SkeletonPiece width={72} height={28} style={styles.chipBone} />
              <SkeletonPiece width={84} height={28} style={styles.chipBone} />
            </View>
            <SkeletonPiece width="88%" height={20} style={styles.mb8} />
            <SkeletonPiece width="70%" height={20} style={styles.mb10} />
            <SkeletonPiece width="60%" height={14} style={styles.mb8} />
            <SkeletonPiece width="50%" height={14} style={styles.mb8} />
            <SkeletonPiece width="80%" height={14} style={styles.mb10} />
            <View style={styles.footerRow}>
              <View style={styles.avatarStack}>
                {[0, 1, 2].map((j) => (
                  <View key={j} style={[styles.avatarBone, j > 0 && styles.avatarOverlap]}>
                    <SkeletonPiece width={28} height={28} style={styles.avatarPiece} />
                  </View>
                ))}
              </View>
              <SkeletonPiece width={72} height={13} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  pad: {
    paddingHorizontal: PAD_H,
    paddingTop: 4,
    paddingBottom: 2,
  },
  sectionSpacer: {
    height: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchShell: {
    flex: 1,
    borderRadius: 14,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  searchMidWrap: {
    flex: 1,
    marginLeft: 8,
    minWidth: 0,
  },
  filterBone: {
    borderRadius: 14,
  },
  round6: {
    borderRadius: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabPiece: {
    borderRadius: 16,
  },
  sectionTitleBone: {
    borderRadius: 6,
  },
  cardWrap: {
    alignSelf: 'center',
    width: CARD_W,
    marginBottom: 20,
  },
  heroBone: {
    borderRadius: 16,
  },
  body: {
    paddingTop: 10,
    paddingBottom: 0,
    gap: 8,
  },
  chipRowBone: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  chipBone: {
    borderRadius: 999,
  },
  pill: {
    borderRadius: 8,
  },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBone: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarPiece: {
    borderRadius: 14,
  },
  avatarOverlap: {
    marginLeft: -9,
  },
});
