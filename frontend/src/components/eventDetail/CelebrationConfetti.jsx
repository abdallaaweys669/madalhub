import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PARTICLE_COUNT = 36;
const CONFETTI_COLORS = ['#FF7B3F', '#FF9A3D', '#16A34A', '#FBBF24', '#FFFFFF', '#38BDF8', '#F472B6', '#22C55E'];

function buildParticles(seed) {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    id: index,
    x: (index / PARTICLE_COUNT) * SCREEN_W + (Math.random() - 0.5) * 40,
    delay: (index % 8) * 40 + Math.random() * 120,
    duration: 1400 + Math.random() * 900,
    drift: (Math.random() - 0.5) * 120,
    sway: (Math.random() - 0.5) * 60,
    size: 5 + Math.random() * 8,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    round: Math.random() > 0.35,
    spin: (Math.random() - 0.5) * 720,
    startY: -40 - Math.random() * SCREEN_H * 0.15,
  }));
}

function ConfettiPiece({ piece }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.out(Easing.quad) }),
    );
  }, [piece.delay, piece.duration, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: piece.x + piece.drift * progress.value + piece.sway * Math.sin(progress.value * Math.PI) },
      { translateY: piece.startY + (SCREEN_H * 0.72) * progress.value },
      { rotate: `${piece.spin * progress.value}deg` },
      { scale: interpolate(progress.value, [0, 0.15, 1], [0.4, 1, 0.9]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.55,
          borderRadius: piece.round ? piece.size / 2 : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

export default function CelebrationConfetti({ active = true, seed = 0 }) {
  const particles = useMemo(() => buildParticles(seed), [seed]);

  if (!active) return null;

  return (
    <>
      {particles.map((piece) => (
        <ConfettiPiece key={`${seed}-${piece.id}`} piece={piece} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
