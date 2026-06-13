import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Skeleton, { SkeletonPiece } from '@/components/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const INNER_WIDTH = SCREEN_WIDTH - H_PAD * 2;

export default function CreateEventSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 150 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerActions}>
          <SkeletonPiece width={40} height={40} style={styles.circle} />
          <SkeletonPiece width={40} height={40} style={styles.circle} />
        </View>
        <Skeleton containerStyle={styles.coverCard}>
          <SkeletonPiece width={58} height={58} style={styles.coverIcon} />
          <SkeletonPiece width={180} height={20} style={styles.mt14} />
          <SkeletonPiece width={230} height={14} style={styles.mt8} />
          <SkeletonPiece width={156} height={30} style={styles.metaPill} />
        </Skeleton>
      </View>

      <View style={styles.body}>
        <View style={styles.chipsRow}>
          <SkeletonPiece width={112} height={30} style={styles.chip} />
          <SkeletonPiece width={108} height={30} style={styles.chip} />
          <SkeletonPiece width={86} height={30} style={styles.chip} />
        </View>

        <SkeletonPiece width={Math.round(INNER_WIDTH * 0.82)} height={30} style={styles.titleLine} />
        <SkeletonPiece width={Math.round(INNER_WIDTH * 0.9)} height={17} style={styles.mb10} />
        <SkeletonPiece width={Math.round(INNER_WIDTH * 0.62)} height={17} style={styles.mb24} />

        <SkeletonPiece width={86} height={18} style={styles.sectionLabel} />

        <View style={styles.infoRow}>
          <SkeletonPiece width={44} height={44} style={styles.infoIcon} />
          <View style={styles.infoText}>
            <SkeletonPiece width={120} height={17} style={styles.mb8} />
            <SkeletonPiece width={160} height={14} />
          </View>
        </View>

        <View style={styles.infoRow}>
          <SkeletonPiece width={44} height={44} style={styles.infoIcon} />
          <View style={styles.infoText}>
            <SkeletonPiece width={220} height={17} style={styles.mb8} />
            <SkeletonPiece width={250} height={14} />
          </View>
        </View>

        <SkeletonPiece width={128} height={24} style={styles.orgTitle} />
        <Skeleton containerStyle={styles.orgCard}>
          <SkeletonPiece width={48} height={48} style={styles.orgAvatar} />
          <View style={styles.infoText}>
            <SkeletonPiece width={150} height={17} style={styles.mb8} />
            <SkeletonPiece width={230} height={14} />
          </View>
        </Skeleton>

        <SkeletonPiece width={154} height={24} style={styles.sectionTitle} />
        <Skeleton containerStyle={styles.wideCard}>
          <SkeletonPiece width="100%" height={76} style={styles.round16} />
        </Skeleton>
        <SkeletonPiece width={170} height={24} style={styles.sectionTitle} />
        <Skeleton containerStyle={styles.wideCard}>
          <View style={styles.sponsorRow}>
            <SkeletonPiece width={96} height={74} style={styles.sponsorTile} />
            <SkeletonPiece width={96} height={74} style={styles.sponsorTile} />
            <SkeletonPiece width={96} height={74} style={styles.sponsorTile} />
          </View>
        </Skeleton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { backgroundColor: '#FFFFFF' },
  header: {
    height: 310,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  headerActions: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circle: { borderRadius: 20 },
  coverCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 64,
    height: 210,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  coverIcon: { borderRadius: 21 },
  mt8: { marginTop: 8 },
  mt14: { marginTop: 14 },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb24: { marginBottom: 24 },
  metaPill: { marginTop: 16, borderRadius: 999 },
  body: {
    paddingHorizontal: H_PAD,
    paddingTop: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  chip: { borderRadius: 999 },
  titleLine: { marginBottom: 28, borderRadius: 8 },
  sectionLabel: { marginBottom: 16, borderRadius: 6 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  infoIcon: { borderRadius: 14, marginRight: 14 },
  infoText: { flex: 1 },
  orgTitle: { marginTop: 8, marginBottom: 12, borderRadius: 8 },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  orgAvatar: { borderRadius: 14 },
  sectionTitle: { marginBottom: 12, borderRadius: 8 },
  wideCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  round16: { borderRadius: 16 },
  sponsorRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sponsorTile: { borderRadius: 14 },
});
