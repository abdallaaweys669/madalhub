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

import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { styles as detailStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import { formatRosterRoleLabel } from '@/utils/eventRosterByFormat';
import { getLineupCarouselMetrics } from '@/components/eventDetail/lineupCarouselLayout';

function SpeakerAvatar({ person, size }) {
  const uri = resolveApiAssetUrl(person.photoUrl);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
        accessibilityLabel={person.displayName}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MemberInitialAvatar
        name={person.displayName || 'Speaker'}
        size={Math.round(size * 0.38)}
        borderWidth={0}
      />
    </View>
  );
}

function SpeakerCard({ person, onPress, showRole = false, metrics }) {
  const roleLabel = showRole ? formatRosterRoleLabel(person.role) : '';

  const card = (
    <View style={[styles.card, { width: metrics.cardWidth }]}>
      <View style={[styles.avatarRing, { width: metrics.avatarSize + 6, height: metrics.avatarSize + 6 }]}>
        <SpeakerAvatar person={person} size={metrics.avatarSize} />
      </View>
      {roleLabel ? (
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText} numberOfLines={1}>
            {roleLabel}
          </Text>
        </View>
      ) : null}
      <Text style={styles.name} numberOfLines={2}>
        {person.displayName}
      </Text>
    </View>
  );

  if (!onPress) return card;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${person.displayName}`}
      style={({ pressed }) => [pressed && styles.cardPressed]}
    >
      {card}
    </Pressable>
  );
}

const FeaturedSpeakersCarousel = ({
  roster,
  onSpeakerPress,
  showTitle = true,
  sectionTitle = 'Featured Speakers',
  showRole = false,
  autoScroll = true,
  ListFooterComponent = null,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const metrics = useMemo(() => getLineupCarouselMetrics(windowWidth), [windowWidth]);
  const listRef = useRef(null);
  const offsetRef = useRef(0);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);

  const shouldAutoSlide = autoScroll && roster?.length >= 5;
  const loopData = useMemo(() => {
    if (!roster?.length) return [];
    if (!shouldAutoSlide) {
      return roster.map((person, index) => ({
        ...person,
        loopKey: `${person.id ?? person.displayName}-${index}`,
        sourceIndex: index,
      }));
    }

    return [...roster, ...roster].map((person, index) => ({
      ...person,
      loopKey: `${person.id ?? person.displayName}-loop-${index}`,
      sourceIndex: index % roster.length,
    }));
  }, [roster, shouldAutoSlide]);

  const loopWidth = shouldAutoSlide ? roster.length * metrics.itemStride : 0;

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

  if (!roster?.length && !ListFooterComponent) return null;

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

  const showEdgeFade = (roster?.length ?? 0) > 3;

  const carousel = (
    <View style={styles.carouselShell}>
      <FlatList
        ref={listRef}
        data={loopData}
        horizontal
        keyExtractor={(item) => item.loopKey}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={metrics.itemStride}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={(roster?.length ?? 0) > 1}
        onScroll={(event) => {
          if (shouldAutoSlide) {
            offsetRef.current = event.nativeEvent.contentOffset.x;
          }
        }}
        onScrollBeginDrag={pauseAutoScroll}
        onScrollEndDrag={resumeAutoScroll}
        onMomentumScrollEnd={resumeAutoScroll}
        renderItem={({ item, index }) => (
          <View style={{ marginRight: metrics.cardGap }}>
            <SpeakerCard
              person={item}
              showRole={showRole}
              metrics={metrics}
              onPress={
                onSpeakerPress
                  ? () => onSpeakerPress(item, item.sourceIndex ?? index)
                  : undefined
              }
            />
          </View>
        )}
        ListFooterComponent={ListFooterComponent}
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

  if (!showTitle) return <View style={styles.section}>{carousel}</View>;

  return (
    <View style={styles.section}>
      <Text style={detailStyles.sectionTitle}>{sectionTitle}</Text>
      {carousel}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  carouselShell: {
    position: 'relative',
  },
  scrollContent: {
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
  card: {
    alignItems: 'center',
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  avatarRing: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  rolePill: {
    marginTop: 6,
    maxWidth: '100%',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EA580C',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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

export default FeaturedSpeakersCarousel;
