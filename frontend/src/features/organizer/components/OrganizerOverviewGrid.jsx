import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function parseMetricValue(value) {
  const raw = String(value ?? '0').replace(/,/g, '');
  if (raw.endsWith('K')) return parseFloat(raw) * 1000;
  if (raw.endsWith('M')) return parseFloat(raw) * 1000000;
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function StrongMetricIcon({ icon, accent, ring, showLivePulse }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.iconOuter, { backgroundColor: ring }]}>
        <View style={[styles.iconInner, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={22} color="#FFFFFF" />
        </View>
      </View>
      {showLivePulse ? <LivePulse /> : null}
    </View>
  );
}

function LivePulse() {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.livePulseWrap}>
      <Animated.View style={[styles.livePulseRing, { opacity: pulse, transform: [{ scale: pulse }] }]} />
      <View style={styles.livePulseDot} />
    </View>
  );
}

function OverviewMetricTile({ icon, accent, ring, value, label, onPress, animStyle, showLivePulse }) {
  const content = (
    <>
      <StrongMetricIcon icon={icon} accent={accent} ring={ring} showLivePulse={showLivePulse} />
      <Text allowFontScaling={false} style={[styles.value, { color: accent }]}>
        {value}
      </Text>
      <Text allowFontScaling={false} style={styles.label}>
        {label}
      </Text>
    </>
  );

  if (!onPress) {
    return <Animated.View style={[styles.tile, animStyle]}>{content}</Animated.View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <Animated.View style={[styles.tileInner, animStyle]}>{content}</Animated.View>
    </Pressable>
  );
}

export default function OrganizerOverviewGrid({ metrics = {}, onPressMetric }) {
  const safeMetrics = {
    events: metrics.events ?? '0',
    attendees: metrics.attendees ?? '0',
    upcoming: metrics.upcoming ?? '0',
    drafts: metrics.drafts ?? '0',
    live: metrics.live ?? '0',
    past: metrics.past ?? '0',
  };

  const liveActive = parseMetricValue(safeMetrics.live) > 0;

  const tiles = [
    {
      id: 'events',
      icon: 'calendar',
      accent: '#FF7B3F',
      ring: '#FFE4D4',
      value: safeMetrics.events,
      label: 'Events',
    },
    {
      id: 'attendees',
      icon: 'people',
      accent: '#3B82F6',
      ring: '#DBEAFE',
      value: safeMetrics.attendees,
      label: 'Attendees',
    },
    {
      id: 'upcoming',
      icon: 'time-outline',
      accent: '#8B5CF6',
      ring: '#EDE9FE',
      value: safeMetrics.upcoming,
      label: 'Upcoming',
    },
    {
      id: 'drafts',
      icon: 'document-text-outline',
      accent: '#F59E0B',
      ring: '#FEF3C7',
      value: safeMetrics.drafts,
      label: 'Drafts',
    },
    {
      id: 'live',
      icon: 'radio-outline',
      accent: '#10B981',
      ring: '#D1FAE5',
      value: safeMetrics.live,
      label: 'Live',
      showLivePulse: liveActive,
    },
    {
      id: 'past',
      icon: 'archive-outline',
      accent: '#64748B',
      ring: '#E2E8F0',
      value: safeMetrics.past,
      label: 'Past',
    },
  ];

  const anims = useRef(tiles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      45,
      anims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 72,
          friction: 10,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [anims]);

  const tileAnim = (index) => ({
    opacity: anims[index],
    transform: [
      {
        translateY: anims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  });

  return (
    <View style={styles.grid}>
      {tiles.map(({ id, ...tileProps }, index) => (
        <OverviewMetricTile
          key={id}
          {...tileProps}
          animStyle={tileAnim(index)}
          onPress={onPressMetric ? () => onPressMetric(id) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 10,
  },
  tile: {
    width: '33.333%',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 14,
  },
  tileInner: {
    alignItems: 'center',
  },
  tilePressed: {
    opacity: 0.86,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    position: 'relative',
  },
  iconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  iconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 11,
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  livePulseWrap: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulseRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34D399',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
