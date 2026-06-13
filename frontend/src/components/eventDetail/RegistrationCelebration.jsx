import React, { useEffect, useMemo } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PARTICLE_COUNT = 22;
const CONFETTI_COLORS = ['#FF7B3F', '#FF9A3D', '#16A34A', '#FBBF24', '#FFFFFF', '#38BDF8', '#F472B6'];

function buildParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    id: index,
    x: Math.random() * SCREEN_W,
    delay: Math.random() * 300,
    duration: 1600 + Math.random() * 700,
    drift: (Math.random() - 0.5) * 100,
    size: 5 + Math.random() * 7,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    round: Math.random() > 0.4,
    spin: (Math.random() - 0.5) * 540,
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
    opacity: 1 - progress.value * 0.4,
    transform: [
      { translateX: piece.x + piece.drift * progress.value },
      { translateY: -20 + (SCREEN_H * 0.55 + piece.size) * progress.value },
      { rotate: `${piece.spin * progress.value}deg` },
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

export default function RegistrationCelebration({ visible = true, onFinish }) {
  const particles = useMemo(() => buildParticles(), []);
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.82);
  const cardOpacity = useSharedValue(0);
  const emojiScale = useSharedValue(0.2);
  const emojiRotate = useSharedValue(-16);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(12);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    backdropOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    cardOpacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    cardScale.value = withSpring(1, { damping: 14, stiffness: 180 });

    emojiScale.value = withDelay(
      80,
      withSequence(
        withSpring(1.28, { damping: 7, stiffness: 220 }),
        withSpring(1, { damping: 10, stiffness: 160 }),
      ),
    );
    emojiRotate.value = withDelay(
      80,
      withSequence(
        withTiming(10, { duration: 110 }),
        withTiming(-8, { duration: 110 }),
        withTiming(4, { duration: 90 }),
        withTiming(0, { duration: 90 }),
      ),
    );

    titleOpacity.value = withDelay(200, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
    titleY.value = withDelay(200, withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }));
    subtitleOpacity.value = withDelay(320, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));

    backdropOpacity.value = withDelay(
      2200,
      withTiming(0, { duration: 380, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onFinish)?.();
      }),
    );
    cardOpacity.value = withDelay(2200, withTiming(0, { duration: 320, easing: Easing.in(Easing.cubic) }));
    cardScale.value = withDelay(2200, withTiming(0.94, { duration: 320, easing: Easing.in(Easing.cubic) }));
  }, [
    backdropOpacity,
    cardOpacity,
    cardScale,
    emojiRotate,
    emojiScale,
    onFinish,
    subtitleOpacity,
    titleOpacity,
    titleY,
    visible,
  ]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }, { rotate: `${emojiRotate.value}deg` }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onFinish}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFinish} accessibilityLabel="Dismiss" />

        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particles.map((piece) => (
            <ConfettiPiece key={piece.id} piece={piece} />
          ))}
        </View>

        <Animated.View style={[styles.card, cardStyle]}>
          <Animated.Text style={[styles.emoji, emojiStyle]} accessibilityLabel="Celebration">
            🎉
          </Animated.Text>
          <Animated.Text style={[styles.title, titleStyle]}>You&apos;re going!</Animated.Text>
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            Your spot is saved. See you at the event!
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
  emoji: {
    fontSize: 58,
    lineHeight: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
