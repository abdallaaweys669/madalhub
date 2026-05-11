import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, Image, View } from 'react-native';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { sponsorCarouselStride } from '@/constants/sponsorTiles';

const SponsorCarousel = ({ logos = [] }) => {
  const listRef = useRef(null);
  const offsetRef = useRef(0);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const shouldAutoSlide = logos.length >= 4;

  const itemStride = sponsorCarouselStride();

  const loopData = useMemo(
    () =>
      shouldAutoSlide
        ? [...logos, ...logos].map((logo, index) => ({ ...logo, id: `${logo.id}-${index}` }))
        : logos.map((logo, index) => ({ ...logo, id: `${logo.id}-${index}` })),
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

  return (
    <View>
      <FlatList
        ref={listRef}
        data={loopData}
        horizontal
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.sponsorCarouselList,
          logos.length <= 2 ? styles.sponsorsRowCentered : null,
        ]}
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
          <View style={[styles.sponsorLogoTile, styles.sponsorCarouselSlot]}>
            <Image source={item.image} style={styles.sponsorLogo} resizeMode="contain" />
          </View>
        )}
      />
    </View>
  );
};

export default SponsorCarousel;
