import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/api/client';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

const COVER_ASPECT = 16 / 9;
const HORIZONTAL_PAD = 20;

function resolveServerCoverUrl(coverPath) {
  if (!coverPath || typeof coverPath !== 'string') return null;
  const trimmed = coverPath.trim();
  if (!trimmed) return null;
  if (/^(file|content|ph):\/\//i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = String(API_BASE_URL || '').replace(/\/+$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return base ? `${base}${path}` : trimmed;
}

export default function WysiwygHeader({
  coverPath,
  coverPreviewUri,
  onBack,
  onPickCover,
  coverUploading = false,
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [imageFailed, setImageFailed] = useState(false);

  const coverWidth = Math.max(0, windowWidth - HORIZONTAL_PAD * 2);
  const coverHeight = Math.round(coverWidth / COVER_ASPECT);

  const localPreviewUrl = useMemo(() => {
    const raw = typeof coverPreviewUri === 'string' ? coverPreviewUri.trim() : '';
    return raw || null;
  }, [coverPreviewUri]);

  const serverCoverUrl = useMemo(() => resolveServerCoverUrl(coverPath), [coverPath]);

  // Keep showing the picked gallery file while creating; server path is for save/publish only.
  const displayUrl = localPreviewUrl || serverCoverUrl;

  useEffect(() => {
    setImageFailed(false);
  }, [displayUrl]);

  const hasCover = Boolean(displayUrl) && !imageFailed;

  return (
    <View style={[eventStyles.headerWrapper, styles.header]}>
      <View style={[styles.toolbar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={[eventStyles.iconButtonMeetup, styles.backButton]}>
          <Feather name="arrow-left" size={20} color="#111827" />
        </Pressable>
      </View>

      <View style={styles.coverCanvas}>
        <Pressable
          onPress={onPickCover}
          disabled={coverUploading}
          accessibilityRole="button"
          accessibilityLabel={hasCover ? 'Change event cover photo' : 'Add event cover photo'}
          style={({ pressed }) => [
            styles.coverPressable,
            { width: coverWidth, height: coverHeight },
            !hasCover && styles.coverPressableEmpty,
            pressed && !coverUploading ? styles.coverPressablePressed : null,
          ]}
        >
          {hasCover ? (
            <View style={styles.coverMediaFrame}>
              <Image
                key={displayUrl}
                source={{ uri: displayUrl }}
                style={styles.coverImage}
                resizeMode="cover"
                onError={() => setImageFailed(true)}
              />
              <LinearGradient
                colors={['rgba(15,23,42,0.08)', 'rgba(15,23,42,0.55)']}
                style={styles.coverScrim}
                pointerEvents="none"
              />
              <View style={styles.coverActionRow} pointerEvents="none">
                <View style={styles.coverActionPill}>
                  <Feather name="camera" size={15} color="#FFFFFF" />
                  <Text style={styles.coverActionText}>Change cover</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyInner}>
              <View style={styles.emptyEdgeSpacer} />
              <View style={styles.emptyCluster}>
                <View style={styles.uploadIconRing}>
                  <Feather name="image" size={30} color="#EA580C" />
                  <View style={styles.uploadPlusBadge}>
                    <Feather name="plus" size={14} color="#FFFFFF" />
                  </View>
                </View>

                <Text style={styles.uploadTitle}>Add cover photo</Text>
                <Text style={styles.uploadSubtitle}>Tap to choose from gallery · auto-cropped to 16:9</Text>
              </View>
              <View style={styles.emptyEdgeSpacer} />
            </View>
          )}

          {coverUploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={styles.uploadingText}>Uploading cover…</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
  },
  toolbar: {
    paddingHorizontal: HORIZONTAL_PAD,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  coverCanvas: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: HORIZONTAL_PAD,
    paddingBottom: 16,
    alignItems: 'center',
  },
  coverPressable: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  coverPressableEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FDBA74',
    backgroundColor: '#FFFBF5',
  },
  coverPressablePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  coverMediaFrame: {
    ...StyleSheet.absoluteFillObject,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coverScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  coverActionRow: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 14,
  },
  coverActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  coverActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyEdgeSpacer: {
    flex: 1,
    minHeight: 12,
  },
  emptyCluster: {
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
    paddingVertical: 4,
  },
  uploadIconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  uploadPlusBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF7A00',
    borderWidth: 2,
    borderColor: '#FFFBF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  uploadSubtitle: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 268,
    marginTop: -4,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 5,
  },
  uploadingText: {
    color: '#9A3412',
    fontSize: 14,
    fontWeight: '700',
  },
});
