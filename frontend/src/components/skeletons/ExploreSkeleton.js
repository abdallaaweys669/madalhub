import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

import Skeleton, { SkeletonPiece } from '@/components/Skeleton';
import {
  EVENT_FEED_AVATAR_SIZE_FLAT,
  EVENT_FEED_COVER_ASPECT,
  EVENT_FEED_IMAGE_RADIUS_FLAT,
  EVENT_FEED_LIST_HORIZONTAL_INSET,
} from '@/components/event/feed/eventFeedTokens';
import { spacing } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const PAD_H = EVENT_FEED_LIST_HORIZONTAL_INSET;
const CARD_W = SCREEN_W - PAD_H * 2;
const HERO_H = Math.round(CARD_W / EVENT_FEED_COVER_ASPECT);
const AVATAR = EVENT_FEED_AVATAR_SIZE_FLAT;

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
              <SkeletonPiece width={34} height={34} style={styles.searchIconBone} />
              <View style={styles.searchMidWrap}>
                <SkeletonPiece width="100%" height={15} style={styles.round6} />
              </View>
            </View>
          </Skeleton>
          <SkeletonPiece width={108} height={52} style={styles.filterBone} />
        </View>

        <View style={styles.sectionSpacer} />

        <View style={styles.timePillsRow}>
          {[88, 72, 56, 76, 96, 72, 84].map((width, i) => (
            <SkeletonPiece key={`time-${i}`} width={width} height={36} style={styles.timePillBone} />
          ))}
        </View>

        <View style={styles.sectionSpacerSm} />

        <View style={styles.tabsRow}>
          {tabWidths.map((tw, i) => (
            <SkeletonPiece key={i} width={tw} height={32} style={styles.tabPiece} />
          ))}
        </View>

        <View style={styles.sectionSpacer} />
        <SkeletonPiece width={100} height={18} style={styles.sectionTitleBone} />
        <View style={styles.sectionSpacerSm} />
      </View>

      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.cardWrap}>
          <SkeletonPiece width={CARD_W} height={HERO_H} style={styles.heroBone} />
          <View style={styles.body}>
            <SkeletonPiece width="88%" height={18} style={styles.titleBone} />
            <View style={styles.chipRowBone}>
              <SkeletonPiece width={72} height={20} style={styles.chipBone} />
              <SkeletonPiece width={64} height={20} style={styles.chipBone} />
              <SkeletonPiece width={76} height={20} style={styles.chipBone} />
            </View>
            <View style={styles.metaRow}>
              <SkeletonPiece width={26} height={26} style={styles.metaChipBone} />
              <SkeletonPiece width="72%" height={14} style={styles.metaTextBone} />
            </View>
            <View style={styles.metaRow}>
              <SkeletonPiece width={26} height={26} style={styles.metaChipBone} />
              <SkeletonPiece width="58%" height={14} style={styles.metaTextBone} />
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerRow}>
              <SkeletonPiece width={56} height={22} style={styles.priceBone} />
              <View style={styles.footerRight}>
                <View style={styles.avatarStack}>
                  {[0, 1, 2].map((j) => (
                    <View key={j} style={[styles.avatarBone, j > 0 && styles.avatarOverlap]}>
                      <SkeletonPiece width={AVATAR} height={AVATAR} style={styles.avatarPiece} />
                    </View>
                  ))}
                </View>
                <SkeletonPiece width={28} height={AVATAR} style={styles.countBone} />
                <SkeletonPiece width={36} height={12} />
              </View>
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
  sectionSpacerSm: {
    height: 10,
  },
  timePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timePillBone: {
    borderRadius: 999,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchShell: {
    flex: 1,
    borderRadius: 26,
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    backgroundColor: '#FFFBF7',
    overflow: 'hidden',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  searchIconBone: {
    borderRadius: 17,
    marginRight: 4,
  },
  searchMidWrap: {
    flex: 1,
    marginLeft: 8,
    minWidth: 0,
  },
  filterBone: {
    borderRadius: 26,
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
    marginBottom: 14,
  },
  heroBone: {
    borderRadius: EVENT_FEED_IMAGE_RADIUS_FLAT,
    marginBottom: 8,
  },
  body: {
    paddingTop: 0,
    gap: 0,
  },
  titleBone: {
    borderRadius: 6,
    marginBottom: 5,
  },
  chipRowBone: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 5,
  },
  chipBone: {
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  metaChipBone: {
    borderRadius: 8,
  },
  metaTextBone: {
    borderRadius: 6,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F2',
    marginTop: 1,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceBone: {
    borderRadius: 6,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBone: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
  },
  avatarPiece: {
    borderRadius: AVATAR / 2,
  },
  avatarOverlap: {
    marginLeft: -9,
  },
  countBone: {
    borderRadius: AVATAR / 2,
  },
});
