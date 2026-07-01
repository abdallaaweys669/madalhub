import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const CALENDAR_ART = require('@/assets/cal_dashboard.png');

const GRID_COLS = 6;
const GRID_ROWS = 4;

function HeroInsightsBackdrop() {
  const sparkLine = 'M14 84 C 42 80, 58 68, 82 56 S 118 36, 152 22 L 168 16';
  const sparkArea = `${sparkLine} L168 92 L14 92 Z`;

  const gridDots = [];
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      gridDots.push({ cx: 22 + col * 26, cy: 24 + row * 22 });
    }
  }

  return (
    <View pointerEvents="none" style={styles.insightsWrap}>
      <View style={styles.glassPanel}>
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Svg width={184} height={112} viewBox="0 0 184 112" style={styles.sparkSvg}>
        <Defs>
          <SvgLinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </SvgLinearGradient>
          <SvgLinearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <Stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
          </SvgLinearGradient>
        </Defs>

        <G opacity={0.35}>
          {gridDots.map((dot) => (
            <Circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={1.2} fill="#FFFFFF" />
          ))}
        </G>

        <Path d={sparkArea} fill="url(#sparkFill)" />
        <Path
          d={sparkLine}
          stroke="url(#sparkStroke)"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Circle cx={168} cy={16} r={9} fill="#FFFFFF" fillOpacity={0.12} />
        <Circle cx={168} cy={16} r={4.5} fill="#FFFFFF" fillOpacity={0.95} />
      </Svg>
    </View>
  );
}

export default function OrganizerHomeHero({ onCreateEvent }) {
  return (
    <View style={styles.shadowShell}>
      <LinearGradient
        colors={['#FF7A20', '#FF8530', '#FF7518']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <HeroInsightsBackdrop />

        <View style={styles.copyCol}>
          <Text style={styles.eyebrow}>Let&apos;s create impact together</Text>
          <Text style={styles.headline}>
            Plan, publish, and{'\n'}grow your events
          </Text>

          <Pressable
            onPress={onCreateEvent}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Create new event"
          >
            <Text style={styles.ctaText}>+ Create new event</Text>
          </Pressable>
        </View>

        <View pointerEvents="none" style={styles.artWrap}>
          <Image
            source={CALENDAR_ART}
            style={styles.calendarArt}
            accessibilityIgnoresInvertColors
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    marginBottom: 16,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#C2410C',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 136,
    paddingLeft: 18,
    paddingRight: 18,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'center',
  },
  insightsWrap: {
    position: 'absolute',
    right: 4,
    top: 10,
    bottom: 10,
    width: 168,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassPanel: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sparkSvg: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    opacity: 0.95,
  },
  copyCol: {
    zIndex: 3,
    paddingRight: 112,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.93)',
    fontWeight: '500',
  },
  headline: {
    marginTop: 5,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.35,
  },
  cta: {
    marginTop: 11,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 9,
    zIndex: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#7C2D12',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  ctaPressed: {
    opacity: 0.93,
    transform: [{ scale: 0.985 }],
  },
  ctaText: {
    color: '#FF7A20',
    fontWeight: '800',
    fontSize: 13,
  },
  artWrap: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 118,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarArt: {
    width: 116,
    height: 116,
    resizeMode: 'contain',
  },
});
