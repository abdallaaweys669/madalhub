import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

import Skeleton, { SkeletonPiece } from '@/components/Skeleton';
import { spacing } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

/** Same card silhouette as `HomeSkeleton` (image on top, body + badge + avatars). */
const CARD_IMAGE_HEIGHT = 152;
const CARD_RADIUS = 16;
const PAD_H = 16;

/**
 * Explore loading: search bar + 3 tab chips + vertical cards matching home skeleton style.
 */
export default function ExploreSkeleton() {
  const cardWidth = SCREEN_W - spacing.lg * 2;
  const cardBodyInner = cardWidth - spacing.md * 2;

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
        <Skeleton key={i} containerStyle={[styles.cardWrap, { width: cardWidth }]}>
          <View style={styles.cardImageWrap}>
            <SkeletonPiece width={cardWidth} height={CARD_IMAGE_HEIGHT} style={styles.cardImage} />
          </View>
          <View style={styles.cardBody}>
            <SkeletonPiece
              width={Math.round(cardBodyInner * 0.92)}
              height={17}
              style={styles.mb8}
            />
            <SkeletonPiece
              width={Math.round(cardBodyInner * 0.78)}
              height={14}
              style={styles.mb8}
            />
            <SkeletonPiece width={92} height={26} style={styles.badgePiece} />
            <View style={styles.divider} />
            <View style={styles.socialRow}>
              <View style={styles.avatarStack}>
                {[0, 1, 2].map((j) => (
                  <View key={j} style={[styles.avatarBone, j > 0 && styles.avatarOverlap]}>
                    <SkeletonPiece width={30} height={30} style={styles.avatarPiece} />
                  </View>
                ))}
              </View>
              <SkeletonPiece width={72} height={14} />
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
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: CARD_RADIUS,
    backgroundColor: 'transparent',
  },
  cardImageWrap: {
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  cardImage: {
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    borderRadius: 0,
  },
  cardBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  mb8: { marginBottom: 8 },
  badgePiece: {
    borderRadius: 8,
    marginBottom: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ECEEF2',
    marginBottom: 10,
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
    borderRadius: 17,
    overflow: 'hidden',
  },
  avatarPiece: {
    borderRadius: 15,
  },
  avatarOverlap: {
    marginLeft: -10,
  },
});
