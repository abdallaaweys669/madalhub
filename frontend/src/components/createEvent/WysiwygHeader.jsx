import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventCoverBanner } from '@/components/event/EventCoverBanner';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

export default function WysiwygHeader({
  coverPath,
  onBack,
  onPickCover,
  coverUploading = false,
}) {
  const insets = useSafeAreaInsets();
  const hasCover = Boolean(coverPath);

  return (
    <View style={[eventStyles.headerWrapper, styles.header]}>
      <EventCoverBanner
        preset="detail"
        coverImageUrl={coverPath || null}
        title={hasCover ? 'Event cover' : null}
        hidePlaceholderLetter={!hasCover}
        coverGradient={hasCover ? undefined : ['#FFF7ED', '#FFEDD5']}
        onPress={onPickCover}
        style={styles.coverCard}
      >
        {hasCover ? (
          <View style={styles.coverFooter}>
            <View style={styles.coverFooterPill}>
              {coverUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="edit-2" size={15} color="#FFFFFF" />
                  <Text style={styles.coverFooterText}>Change cover</Text>
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyOverlay}>
            {coverUploading ? (
              <ActivityIndicator size="large" color="#EA580C" />
            ) : (
              <>
                <View style={styles.uploadIcon}>
                  <Feather name="upload" size={22} color="#EA580C" />
                </View>
                <Text style={styles.uploadTitle}>Upload cover</Text>
                <Text style={styles.uploadSubtitle}>Tap to choose a photo, then crop to 16:9</Text>
                <View style={styles.uploadMetaPill}>
                  <Feather name="crop" size={13} color="#64748B" />
                  <Text style={styles.uploadMetaText}>16:9 (1200 x 675) recommended</Text>
                </View>
              </>
            )}
          </View>
        )}
      </EventCoverBanner>

      <View style={[styles.backRow, { top: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={[eventStyles.iconButtonMeetup, styles.lightIconButton]}>
          <Feather name="arrow-left" size={20} color="#111827" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 300,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  backRow: {
    position: 'absolute',
    left: 16,
    zIndex: 8,
  },
  lightIconButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coverCard: {
    minHeight: 194,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  uploadSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  uploadMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadMetaText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  coverFooter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  coverFooterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  coverFooterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
