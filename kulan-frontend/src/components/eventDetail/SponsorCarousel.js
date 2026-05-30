import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';

const TILE_WIDTH = 104;
const TILE_GAP = 12;

const tileStyles = StyleSheet.create({
  tile: {
    width: TILE_WIDTH,
    alignItems: 'center',
  },
  logoShell: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  name: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    gap: TILE_GAP,
    paddingVertical: 4,
  },
});

function SponsorTile({ item, onPress }) {
  const tile = (
    <View style={tileStyles.tile}>
      <View style={tileStyles.logoShell}>
        {item.image ? (
          <Image source={item.image} style={tileStyles.logo} resizeMode="contain" />
        ) : null}
      </View>
      <Text style={tileStyles.name} numberOfLines={2}>
        {item.name || 'Sponsor'}
      </Text>
    </View>
  );

  if (!onPress) return tile;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`View ${item.name || 'sponsor'}`}>
      {tile}
    </Pressable>
  );
}

const SponsorCarousel = ({ logos = [], onLogoPress }) => {
  const listRef = useRef(null);
  const offsetRef = useRef(0);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const shouldAutoSlide = logos.length >= 4;
  const itemStride = TILE_WIDTH + TILE_GAP;

  const loopData = useMemo(
    () =>
      shouldAutoSlide
        ? [...logos, ...logos].map((logo, index) => ({
            ...logo,
            id: `${logo.id}-${index}`,
            sourceIndex: index % logos.length,
          }))
        : logos.map((logo, index) => ({ ...logo, id: `${logo.id}-${index}`, sourceIndex: index })),
    [logos, shouldAutoSlide],
  );

  const loopWidth = shouldAutoSlide ? logos.length * itemStride : 0;

  useEffect(() => {
    if (!shouldAutoSlide) return undefined;

    const timer = setInterval(() => {
      if (isInteractingRef.current || !listRef.current) return;
      const nextOffset = offsetRef.current + 0.45;
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

  if (logos.length <= 2) {
    return (
      <View style={tileStyles.row}>
        {logos.map((item, index) => (
          <SponsorTile
            key={item.id || `sponsor-${index}`}
            item={item}
            onPress={onLogoPress ? () => onLogoPress(index) : undefined}
          />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={loopData}
      horizontal
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.sponsorCarouselList}
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      scrollEnabled={logos.length > 2}
      onScroll={(event) => {
        if (shouldAutoSlide) {
          offsetRef.current = event.nativeEvent.contentOffset.x;
        }
      }}
      onScrollBeginDrag={() => {
        if (!shouldAutoSlide) return;
        isInteractingRef.current = true;
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      }}
      onScrollEndDrag={() => {
        if (!shouldAutoSlide) return;
        resumeTimeoutRef.current = setTimeout(() => {
          isInteractingRef.current = false;
        }, 1200);
      }}
      onMomentumScrollEnd={() => {
        if (!shouldAutoSlide) return;
        resumeTimeoutRef.current = setTimeout(() => {
          isInteractingRef.current = false;
        }, 800);
      }}
      renderItem={({ item }) => (
        <View style={[styles.sponsorCarouselSlot, { width: TILE_WIDTH }]}>
          <SponsorTile
            item={item}
            onPress={onLogoPress ? () => onLogoPress(item.sourceIndex ?? 0) : undefined}
          />
        </View>
      )}
    />
  );
};

export default SponsorCarousel;
