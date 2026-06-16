import React, { useEffect, useMemo, useRef } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
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

import CelebrationConfetti from '@/components/eventDetail/CelebrationConfetti';

const { width: SCREEN_W } = Dimensions.get('window');

function resetCelebrationValues(values) {
  values.backdropOpacity.value = 0;
  values.cardScale.value = 0.82;
  values.cardOpacity.value = 0;
  values.emojiScale.value = 0.2;
  values.emojiRotate.value = -16;
  values.titleOpacity.value = 0;
  values.titleY.value = 12;
  values.subtitleOpacity.value = 0;
}

export default function RegistrationCelebration({ visible = false, onFinish, runKey = 0 }) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.82);
  const cardOpacity = useSharedValue(0);
  const emojiScale = useSharedValue(0.2);
  const emojiRotate = useSharedValue(-16);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(12);
  const subtitleOpacity = useSharedValue(0);

  const sharedValues = useMemo(
    () => ({
      backdropOpacity,
      cardScale,
      cardOpacity,
      emojiScale,
      emojiRotate,
      titleOpacity,
      titleY,
      subtitleOpacity,
    }),
    [
      backdropOpacity,
      cardScale,
      cardOpacity,
      emojiScale,
      emojiRotate,
      titleOpacity,
      titleY,
      subtitleOpacity,
    ],
  );

  useEffect(() => {
    if (!visible) {
      resetCelebrationValues(sharedValues);
      return;
    }

    resetCelebrationValues(sharedValues);

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

    const finish = () => onFinishRef.current?.();

    backdropOpacity.value = withDelay(
      2400,
      withTiming(0, { duration: 380, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(finish)();
      }),
    );
    cardOpacity.value = withDelay(2400, withTiming(0, { duration: 320, easing: Easing.in(Easing.cubic) }));
    cardScale.value = withDelay(2400, withTiming(0.94, { duration: 320, easing: Easing.in(Easing.cubic) }));
  }, [visible, runKey, sharedValues]);

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

  const handleDismiss = () => onFinishRef.current?.();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} accessibilityLabel="Dismiss" />

        <View style={StyleSheet.absoluteFill} pointerEvents="none" key={runKey}>
          <CelebrationConfetti active={visible} />
        </View>

        <Animated.View style={[styles.card, cardStyle]}>
          <Animated.Text style={[styles.emoji, emojiStyle]} accessibilityLabel="Celebration">
            🎊
          </Animated.Text>
          <Animated.Text style={[styles.title, titleStyle]}>Congratulations!</Animated.Text>
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            You&apos;re going — your ticket is ready!
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
    maxWidth: Math.min(320, SCREEN_W - 56),
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
});
