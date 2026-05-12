import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Skeleton, { SkeletonPiece } from '@/components/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_PAD = 14;
const CONTENT_WIDTH = SCREEN_WIDTH - PAGE_PAD * 2;
const STAT_GAP = 10;
const STAT_WIDTH = (CONTENT_WIDTH - STAT_GAP) / 2;

export default function OrganizerDashboardSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <Skeleton containerStyle={styles.hero}>
        <View style={styles.logoWrap}>
          <SkeletonPiece width={128} height={38} style={styles.round8} />
        </View>
        <View style={styles.profileCard}>
          <SkeletonPiece width={48} height={48} style={styles.profileAvatar} />
          <View style={styles.profileLines}>
            <SkeletonPiece width="68%" height={16} style={styles.mb8} />
            <SkeletonPiece width="46%" height={12} />
          </View>
          <SkeletonPiece width={32} height={32} style={styles.chevronChip} />
        </View>
        <SkeletonPiece width={Math.round(CONTENT_WIDTH * 0.72)} height={26} style={styles.mt18} />
        <SkeletonPiece width={Math.round(CONTENT_WIDTH * 0.58)} height={14} style={styles.mt8} />
        <View style={styles.nextCard}>
          <View style={styles.nextText}>
            <SkeletonPiece width={90} height={12} style={styles.mb10} />
            <SkeletonPiece width="86%" height={16} style={styles.mb8} />
            <SkeletonPiece width="62%" height={12} />
          </View>
        </View>
      </Skeleton>

      <View style={styles.statsGrid}>
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} containerStyle={styles.statCard}>
            <View style={styles.statTop}>
              <SkeletonPiece width={76} height={11} />
              <SkeletonPiece width={30} height={30} style={styles.statIcon} />
            </View>
            <SkeletonPiece width={46} height={32} style={styles.mt14} />
            <SkeletonPiece width={Math.round(STAT_WIDTH * 0.68)} height={11} style={styles.mt8} />
          </Skeleton>
        ))}
      </View>

      <Skeleton containerStyle={styles.createCard}>
        <SkeletonPiece width={48} height={48} style={styles.createIcon} />
        <View style={styles.createText}>
          <SkeletonPiece width="58%" height={18} style={styles.mb8} />
          <SkeletonPiece width="88%" height={12} />
        </View>
        <SkeletonPiece width={34} height={34} style={styles.arrowChip} />
      </Skeleton>

      <View style={styles.sectionHeader}>
        <SkeletonPiece width={128} height={24} style={styles.mb8} />
        <SkeletonPiece width={110} height={13} />
      </View>

      <View style={styles.tabs}>
        {[82, 94, 112, 82].map((width, index) => (
          <SkeletonPiece key={index} width={width} height={38} style={styles.tab} />
        ))}
      </View>

      {[0, 1].map((item) => (
        <Skeleton key={item} containerStyle={styles.eventCard}>
          <SkeletonPiece width="100%" height={168} style={styles.eventImage} />
          <View style={styles.eventBody}>
            <View style={styles.badgeRow}>
              <SkeletonPiece width={88} height={28} style={styles.pill} />
              <SkeletonPiece width={68} height={28} style={styles.pill} />
            </View>
            <SkeletonPiece width="82%" height={20} style={styles.mb14} />
            <View style={styles.detailRow}>
              <SkeletonPiece width="48%" height={62} style={styles.detailBox} />
              <SkeletonPiece width="48%" height={62} style={styles.detailBox} />
            </View>
            <SkeletonPiece width="58%" height={24} style={styles.mb14} />
            <View style={styles.actionRow}>
              <SkeletonPiece width="48%" height={42} style={styles.actionButton} />
              <SkeletonPiece width="48%" height={42} style={styles.actionButton} />
            </View>
          </View>
        </Skeleton>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F7F7F8' },
  content: { paddingHorizontal: PAGE_PAD },
  hero: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  logoWrap: { alignItems: 'center' },
  profileCard: {
    marginTop: 14,
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: { borderRadius: 18 },
  profileLines: { flex: 1 },
  chevronChip: { borderRadius: 16 },
  round8: { borderRadius: 8 },
  mt8: { marginTop: 8 },
  mt14: { marginTop: 14 },
  mt18: { marginTop: 18 },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb14: { marginBottom: 14 },
  nextCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextText: { flex: 1 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: STAT_GAP,
    marginBottom: 8,
  },
  statCard: {
    width: STAT_WIDTH,
    minHeight: 112,
    borderRadius: 20,
    padding: 14,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statIcon: { borderRadius: 12 },
  createCard: {
    minHeight: 76,
    borderRadius: 26,
    paddingHorizontal: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  createIcon: { borderRadius: 18 },
  createText: { flex: 1 },
  arrowChip: { borderRadius: 17 },
  sectionHeader: { marginBottom: 10 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { borderRadius: 999 },
  eventCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  eventImage: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderRadius: 0 },
  eventBody: { padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pill: { borderRadius: 999 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  detailBox: { borderRadius: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { borderRadius: 13 },
});
