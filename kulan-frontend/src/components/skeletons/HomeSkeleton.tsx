import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

import Skeleton, { SkeletonPiece } from '@/components/Skeleton';
import { spacing } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Mirrors EventCard image block */
const CARD_IMAGE_HEIGHT = 148;
/** Mirrors EventCard outer radius */
const CARD_RADIUS = 16;
/** Mirrors YourEventsSection tabs */
const TAB_RADIUS = 14;

export default function HomeSkeleton() {
  const cardWidth = SCREEN_WIDTH - spacing.md * 2;
  const cardBodyInner = cardWidth - spacing.md * 2;
  const profileTextWidth =
    SCREEN_WIDTH -
    spacing.md * 2 -
    spacing.md -
    spacing.sm -
    44 -
    spacing.sm -
    18 -
    spacing.sm;

  const tabWidths = useMemo(() => {
    const gutter = spacing.lg * 2;
    const gaps = spacing.sm * 2;
    const slot = (SCREEN_WIDTH - gutter - gaps) / 3;
    return [slot, slot, slot] as const;
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Skeleton containerStyle={styles.profileRow}>
        <View style={styles.profileInner}>
          <SkeletonPiece width={44} height={44} style={styles.profileAvatar} />
          <View style={styles.profileLines}>
            <SkeletonPiece width={profileTextWidth} height={16} style={styles.mb8} />
            <SkeletonPiece width={Math.round(profileTextWidth * 0.55)} height={13} />
          </View>
          <SkeletonPiece width={18} height={18} />
        </View>
      </Skeleton>

      <View style={styles.section}>
        <SkeletonPiece width={140} height={26} style={styles.sectionTitle} />
        <View style={styles.tabsRow}>
          {tabWidths.map((tw, i) => (
            <SkeletonPiece key={i} width={tw} height={40} style={styles.tabPiece} />
          ))}
        </View>
      </View>

      {[0, 1, 2].map((i) => (
        <Skeleton key={i} containerStyle={[styles.cardWrap, { width: cardWidth }]}>
          <View style={styles.cardImageWrap}>
            <SkeletonPiece width={cardWidth} height={CARD_IMAGE_HEIGHT} style={styles.cardImage} />
          </View>
          <View style={styles.cardBody}>
            <SkeletonPiece width={Math.round(cardBodyInner * 0.92)} height={17} style={styles.mb8} />
            <SkeletonPiece width={Math.round(cardBodyInner * 0.78)} height={14} style={styles.mb8} />
            <SkeletonPiece width={92} height={26} style={styles.badgePiece} />
            <View style={styles.divider} />
            <View style={styles.socialRow}>
              <View style={styles.avatarStack}>
                {[0, 1, 2].map((j) => (
                  <View
                    key={j}
                    style={[styles.avatarBone, j > 0 && styles.avatarOverlap]}
                  >
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
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  profileRow: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    backgroundColor: 'transparent',
  },
  profileInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    gap: spacing.sm,
  },
  profileAvatar: { borderRadius: 22 },
  profileLines: {
    flex: 1,
    minWidth: 0,
  },
  mb8: { marginBottom: 8 },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sectionTitle: { marginBottom: spacing.sm },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabPiece: {
    borderRadius: TAB_RADIUS,
  },
  cardWrap: {
    alignSelf: 'center',
    marginHorizontal: spacing.md,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  cardImageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    borderRadius: 14,
  },
  cardBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
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
