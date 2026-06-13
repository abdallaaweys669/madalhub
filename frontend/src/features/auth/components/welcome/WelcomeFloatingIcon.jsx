import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '@/constants/loginSignin/authStyles';

/** Gentle bob — slow enough to feel calm, clear enough to notice */
const FLOAT_LIFT = -8;
const FLOAT_DURATION = 3000;

const FLOAT_EASING = Easing.inOut(Easing.ease);

export default function WelcomeFloatingIcon({ name, style, delay = 0, size = 20 }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: FLOAT_DURATION,
          easing: FLOAT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: FLOAT_DURATION,
          easing: FLOAT_EASING,
          useNativeDriver: true,
        }),
      ]),
    );

    const timer = setTimeout(() => loop.start(), delay);

    return () => {
      clearTimeout(timer);
      loop.stop();
      float.stopAnimation(() => float.setValue(0));
    };
  }, [delay, float]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FLOAT_LIFT],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, style, { transform: [{ translateY }] }]}
    >
      <View style={styles.bubble}>
        <Feather name={name} size={size} color={COLORS.primary} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 3,
  },
  bubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 123, 63, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
