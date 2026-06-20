import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { DEFAULT_COVER_GRADIENT } from '@/api/events';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import {
  EVENT_FEED_BOXED_COVER_RATIO,
  EVENT_FEED_COVER_ASPECT,
  EVENT_FEED_IMAGE_RADIUS,
  EVENT_FEED_IMAGE_RADIUS_FLAT,
  EVENT_FEED_LIST_HORIZONTAL_INSET,
} from '@/components/event/feed/eventFeedTokens';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

export type EventCoverBannerPreset = 'feed-flat' | 'feed-boxed' | 'detail';

export type EventCoverBannerProps = {
  coverImageUrl?: string | null;
  coverLetter?: string | null;
  title?: string | null;
  coverGradient?: readonly [string, string];
  preset?: EventCoverBannerPreset;
  /** Used by feed-boxed when height is driven by card inner width. */
  height?: number;
  width?: number | `${number}%`;
  onPress?: () => void;
  placeholderLetterSize?: number;
  hidePlaceholderLetter?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const mediaFillStyle = {
  ...StyleSheet.absoluteFillObject,
  width: '100%',
  height: '100%',
} as const;

function resolvePlaceholderLetter(
  coverLetter?: string | null,
  title?: string | null,
): string {
  return (coverLetter || title || '?').trim().charAt(0).toUpperCase();
}

export function EventCoverBanner({
  coverImageUrl,
  coverLetter,
  title,
  coverGradient = DEFAULT_COVER_GRADIENT,
  preset = 'feed-flat',
  height,
  width,
  onPress,
  placeholderLetterSize = 34,
  hidePlaceholderLetter = false,
  style,
  children,
}: EventCoverBannerProps) {
  const isBoxed = preset === 'feed-boxed';
  const borderRadius = isBoxed ? EVENT_FEED_IMAGE_RADIUS : EVENT_FEED_IMAGE_RADIUS_FLAT;
  const [imageFailed, setImageFailed] = useState(false);

  const resolvedCoverUrl = useMemo(() => {
    if (!coverImageUrl || typeof coverImageUrl !== 'string') return null;
    const trimmed = coverImageUrl.trim();
    if (!trimmed) return null;
    return resolveApiAssetUrl(trimmed) ?? trimmed;
  }, [coverImageUrl]);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedCoverUrl]);

  const showCoverImage = Boolean(resolvedCoverUrl) && !imageFailed;

  const frameStyle = [
    styles.frame,
    preset === 'feed-flat' && styles.presetFeedFlat,
    isBoxed && styles.presetFeedBoxed,
    {
      borderRadius,
      ...(width != null ? { width } : null),
      ...(isBoxed && height != null ? { height } : null),
      ...(!isBoxed ? { aspectRatio: EVENT_FEED_COVER_ASPECT } : null),
    },
    style,
  ];

  const frame = (
    <View style={frameStyle}>
      <View style={styles.mediaLayer} pointerEvents="none">
        {showCoverImage ? (
          <Image
            source={{ uri: resolvedCoverUrl! }}
            style={mediaFillStyle}
            resizeMode="cover"
            accessibilityLabel={title || 'Event cover'}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <CoverPlaceholder
            letter={resolvePlaceholderLetter(coverLetter, title)}
            gradient={coverGradient}
            borderRadius={0}
            style={mediaFillStyle}
            letterSize={placeholderLetterSize}
            showLetter={!hidePlaceholderLetter}
          />
        )}
      </View>
      {onPress ? (
        <Pressable onPress={onPress} style={StyleSheet.absoluteFill} accessibilityRole="button" />
      ) : null}
      {children}
    </View>
  );

  if (preset === 'detail') {
    return <View style={styles.presetDetailWrap}>{frame}</View>;
  }

  return frame;
}

/** Boxed carousel cover height from inner card width. */
export function resolveBoxedCoverHeight(innerWidth: number): number {
  return Math.round(innerWidth * EVENT_FEED_BOXED_COVER_RATIO);
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative',
  },
  mediaLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  presetFeedFlat: {
    marginBottom: 8,
  },
  presetFeedBoxed: {
    marginBottom: 12,
  },
  presetDetailWrap: {
    marginHorizontal: EVENT_FEED_LIST_HORIZONTAL_INSET,
  },
});
