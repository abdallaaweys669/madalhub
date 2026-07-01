import React, { useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { getLineupCarouselMetrics } from '@/components/eventDetail/lineupCarouselLayout';

function SponsorLogo({ item, size }) {
  const radius = Math.round(size * 0.2);

  if (item.image) {
    return (
      <Image
        source={item.image}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="contain"
        accessibilityLabel={item.name || 'Sponsor'}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name="briefcase" size={Math.round(size * 0.28)} color="#94A3B8" />
    </View>
  );
}

function SponsorTile({ item, onPress, metrics }) {
  const tile = (
    <View style={[styles.tile, { width: metrics.cardWidth }]}>
      <View
        style={[
          styles.logoRing,
          { width: metrics.avatarSize + 6, height: metrics.avatarSize + 6 },
        ]}
      >
        <SponsorLogo item={item} size={metrics.avatarSize} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {item.name || 'Sponsor'}
      </Text>
    </View>
  );

  if (!onPress) return tile;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name || 'sponsor'}`}
      style={({ pressed }) => [pressed && styles.tilePressed]}
    >
      {tile}
    </Pressable>
  );
}

const SponsorCarousel = ({ logos = [], onLogoPress, autoScroll = true }) => {
  const { width: windowWidth } = useWindowDimensions();
  const metrics = useMemo(() => getLineupCarouselMetrics(windowWidth), [windowWidth]);
  const listRef = useRef(null);
  const offsetRef = useRef(0);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);

  const shouldAutoSlide = autoScroll && logos.length >= 5;

  const loopData = useMemo(() => {
    if (!logos.length) return [];
    if (!shouldAutoSlide) {
      return logos.map((logo, index) => ({
        ...logo,
        loopKey: `${logo.id ?? logo.name}-${index}`,
        sourceIndex: index,
      }));
    }

    return [...logos, ...logos].map((logo, index) => ({
      ...logo,
      loopKey: `${logo.id ?? logo.name}-loop-${index}`,
      sourceIndex: index % logos.length,
    }));
  }, [logos, shouldAutoSlide]);

  const loopWidth = shouldAutoSlide ? logos.length * metrics.itemStride : 0;

  useEffect(() => {
    if (!shouldAutoSlide) return undefined;

    const timer = setInterval(() => {
      if (isInteractingRef.current || !listRef.current) return;
      const nextOffset = offsetRef.current + 0.28;
      offsetRef.current = nextOffset >= loopWidth ? nextOffset - loopWidth : nextOffset;
      listRef.current.scrollToOffset({ offset: offsetRef.current, animated: false });
    }, 16);

    return () => clearInterval(timer);
  }, [loopWidth, shouldAutoSlide]);

  useEffect(
    () => () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    },
    [],
  );

  if (!logos.length) return null;

  const pauseAutoScroll = () => {
    if (!shouldAutoSlide) return;
    isInteractingRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const resumeAutoScroll = () => {
    if (!shouldAutoSlide) return;
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 1400);
  };

  const showEdgeFade = logos.length > 3;

  return (
    <View style={styles.shell}>
      <FlatList
        ref={listRef}
        data={loopData}
        horizontal
        keyExtractor={(item) => item.loopKey}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={metrics.itemStride}
        contentContainerStyle={styles.listContent}
        scrollEnabled={logos.length > 1}
        onScroll={(event) => {
          if (shouldAutoSlide) {
            offsetRef.current = event.nativeEvent.contentOffset.x;
          }
        }}
        onScrollBeginDrag={pauseAutoScroll}
        onScrollEndDrag={resumeAutoScroll}
        onMomentumScrollEnd={resumeAutoScroll}
        renderItem={({ item }) => (
          <View style={{ marginRight: metrics.cardGap }}>
            <SponsorTile
              item={item}
              metrics={metrics}
              onPress={onLogoPress ? () => onLogoPress(item.sourceIndex ?? 0) : undefined}
            />
          </View>
        )}
      />
      {showEdgeFade ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={['#FFFFFF', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fadeLeft}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0)', '#FFFFFF']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fadeRight}
          />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
  },
  listContent: {
    paddingRight: 6,
    paddingVertical: 4,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 18,
    zIndex: 1,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 22,
    zIndex: 1,
  },
  tile: {
    alignItems: 'center',
  },
  tilePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  logoRing: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  name: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
});

export default SponsorCarousel;
