import React, { useMemo } from 'react';
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

import { resolveApiAssetUrl } from '@/utils/mediaUrl';

const COVER_ASPECT = 16 / 9;

export default function CreateEventCover({
  coverPreviewUri,
  coverPath,
  onPickCover,
  uploading = false,
}) {
  const { width: windowWidth } = useWindowDimensions();
  const coverHeight = Math.max(200, Math.round(windowWidth / COVER_ASPECT));

  const imageUri = useMemo(() => {
    const local = typeof coverPreviewUri === 'string' ? coverPreviewUri.trim() : '';
    if (local) return local;
    return resolveApiAssetUrl(coverPath) ?? null;
  }, [coverPreviewUri, coverPath]);

  const hasImage = Boolean(imageUri);

  return (
    <Pressable
      onPress={onPickCover}
      disabled={uploading}
      accessibilityRole="button"
      accessibilityLabel={hasImage ? 'Change event cover photo' : 'Add event cover photo'}
      style={({ pressed }) => [
        styles.wrap,
        { width: windowWidth, height: coverHeight },
        !hasImage && styles.wrapEmpty,
        pressed && !uploading ? styles.pressed : null,
      ]}
    >
      {hasImage ? (
        <>
          <Image
            source={{ uri: imageUri }}
            style={{ width: windowWidth, height: coverHeight, backgroundColor: '#E5E7EB' }}
            resizeMode="cover"
          />
          <View style={styles.changeBadge}>
            <Feather name="camera" size={14} color="#FFFFFF" />
            <Text style={styles.changeBadgeText}>Change cover</Text>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIconRing}>
            <Feather name="image" size={28} color="#EA580C" />
            <View style={styles.plusBadge}>
              <Feather name="plus" size={12} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Add cover photo</Text>
          <Text style={styles.emptySub}>Tap to choose · cropped to 16:9</Text>
        </View>
      )}

      {uploading ? (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.uploadText}>Uploading…</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFBF5',
    overflow: 'hidden',
    position: 'relative',
  },
  wrapEmpty: {
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  pressed: {
    opacity: 0.94,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF7A00',
    borderWidth: 2,
    borderColor: '#FFFBF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  changeBadge: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.72)',
  },
  changeBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    color: '#9A3412',
    fontSize: 14,
    fontWeight: '700',
  },
});
