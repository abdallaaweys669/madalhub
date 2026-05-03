import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

import Skeleton, { SkeletonPiece } from '../Skeleton';

const { width: SCREEN_W } = Dimensions.get('window');

const PAD_H = 16;
const PAD_TOP = 8;
const SECTION_GAP = 14;
const INNER_W = SCREEN_W - PAD_H * 2;

/** Matches ExploreEventCard thumbnail */
const THUMB_W = 94;
const THUMB_H = 84;
const THUMB_RADIUS = 14;
const AVATAR = 22;
const AVATAR_OVERLAP = -9;

const chipWidths = [68, 84, 92, 78, 72, 88];

/**
 * Explore loading UI: search, category chips, then cards shaped like ExploreEventCard
 * (text left / thumbnail right, then avatars + tag + actions).
 */
export default function ExploreSkeleton() {
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
            <SkeletonPiece width={20} height={20} style={styles.searchIcon} />
            <View style={styles.searchMidWrap}>
              <SkeletonPiece width="100%" height={15} style={styles.searchMid} />
            </View>
            <SkeletonPiece width={22} height={22} style={styles.filterIcon} />
          </View>
        </Skeleton>

        <View style={styles.sectionSpacer} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          nestedScrollEnabled
        >
          {chipWidths.map((w, i) => (
            <Skeleton
              key={i}
              containerStyle={[
                styles.chipWrap,
                { minWidth: w },
                i === 0 ? styles.chipWrapActive : styles.chipWrapInactive,
              ]}
            >
              <SkeletonPiece
                width={16}
                height={16}
                style={[styles.chipIcon, i === 0 && styles.chipIconActive]}
              />
              <SkeletonPiece
                width={Math.max(36, w - 34)}
                height={14}
                style={[styles.chipLabel, i === 0 && styles.chipLabelActive]}
              />
            </Skeleton>
          ))}
        </ScrollView>

        <View style={styles.sectionSpacer} />
      </View>

      <View style={styles.listPad}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} containerStyle={styles.eventCard}>
            <View style={styles.topRow}>
              <View style={styles.textCol}>
                <SkeletonPiece width="94%" height={18} style={styles.titleLine} />
                <SkeletonPiece width="78%" height={18} style={styles.titleLineSecond} />
                <View style={styles.metaRow}>
                  <SkeletonPiece width={13} height={13} style={styles.metaIcon} />
                  <SkeletonPiece width="68%" height={11} style={styles.metaText} />
                </View>
                <View style={styles.metaRow}>
                  <SkeletonPiece width={13} height={13} style={styles.metaIcon} />
                  <SkeletonPiece width="58%" height={12} style={styles.metaText} />
                </View>
              </View>
              <SkeletonPiece
                width={THUMB_W}
                height={THUMB_H}
                style={styles.thumbnail}
              />
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.bottomLeft}>
                <View style={styles.attendeesRow}>
                  <View style={styles.avatarStack}>
                    {[0, 1, 2].map((idx) => (
                      <SkeletonPiece
                        key={idx}
                        width={AVATAR}
                        height={AVATAR}
                        style={[styles.avatar, idx > 0 && { marginLeft: AVATAR_OVERLAP }]}
                      />
                    ))}
                  </View>
                  <SkeletonPiece width={52} height={12} style={styles.goingLine} />
                </View>
                <View style={styles.modeTagWrap}>
                  <SkeletonPiece width={12} height={12} style={styles.modeTagIcon} />
                  <SkeletonPiece width={52} height={8} style={styles.modeTagText} />
                </View>
              </View>
              <View style={styles.actions}>
                <SkeletonPiece width={20} height={20} style={styles.actionDot} />
                <SkeletonPiece width={20} height={20} style={styles.actionDotSecond} />
              </View>
            </View>
          </Skeleton>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
    backgroundColor: '#F5F5F6',
  },
  pad: {
    paddingHorizontal: PAD_H,
    paddingTop: PAD_TOP,
  },
  sectionSpacer: {
    height: SECTION_GAP,
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
  searchIcon: {
    borderRadius: 10,
  },
  searchMidWrap: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    justifyContent: 'center',
    minWidth: 0,
  },
  searchMid: {
    borderRadius: 6,
  },
  filterIcon: {
    borderRadius: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingRight: 10,
    gap: 9,
  },
  chipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 17,
    overflow: 'hidden',
  },
  chipWrapInactive: {
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  chipWrapActive: {
    backgroundColor: '#FF7A3D',
    borderWidth: 1,
    borderColor: '#FF7A3D',
  },
  chipIcon: {
    borderRadius: 8,
  },
  chipIconActive: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  chipLabel: {
    marginLeft: 6,
    borderRadius: 6,
  },
  chipLabelActive: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  listPad: {
    paddingHorizontal: PAD_H,
    paddingTop: 2,
  },
  eventCard: {
    alignSelf: 'stretch',
    maxWidth: INNER_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textCol: {
    flex: 1,
    paddingRight: 12,
    minHeight: THUMB_H,
    justifyContent: 'flex-start',
  },
  titleLine: {
    borderRadius: 6,
    marginBottom: 6,
  },
  titleLineSecond: {
    borderRadius: 6,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaIcon: {
    borderRadius: 4,
  },
  metaText: {
    marginLeft: 4,
    borderRadius: 4,
  },
  thumbnail: {
    borderRadius: THUMB_RADIUS,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  goingLine: {
    marginLeft: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  modeTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3EEFF',
    gap: 4,
  },
  modeTagIcon: {
    borderRadius: 3,
    backgroundColor: '#DDD6FE',
  },
  modeTagText: {
    borderRadius: 3,
    backgroundColor: '#DDD6FE',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionDot: {
    borderRadius: 5,
  },
  actionDotSecond: {
    marginLeft: 6,
    borderRadius: 5,
  },
});
