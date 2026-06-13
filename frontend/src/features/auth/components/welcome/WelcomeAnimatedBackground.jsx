import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { WELCOME_CANVAS } from './welcomeTheme';

const ORBS = [
  { size: 280, top: '-10%', left: '-28%', colors: ['#FFD4BC', '#FFEFE5'], delay: 0, floatRange: 16 },
  { size: 260, top: '4%', right: '-30%', colors: ['#FFC9A8', '#FFF6F2'], delay: 500, floatRange: 14 },
  { size: 220, bottom: '32%', left: '-20%', colors: ['#FFB899', '#FFEFE5'], delay: 1000, floatRange: 12 },
];

function AnimatedOrb({ size, top, left, right, bottom, colors, delay, floatRange }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let pulseLoop;
    let floatLoop;

    const timer = setTimeout(() => {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 4200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 4200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(float, {
            toValue: 1,
            duration: 3600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 3600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      pulseLoop.start();
      floatLoop.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      pulseLoop?.stop();
      floatLoop?.stop();
      pulse.stopAnimation(() => pulse.setValue(0));
      float.stopAnimation(() => float.setValue(0));
    };
  }, [delay, float, pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.68],
  });

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -floatRange],
  });

  const translateX = float.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, floatRange * 0.35, 0],
  });

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
          left,
          right,
          bottom,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export default function WelcomeAnimatedBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[WELCOME_CANVAS, '#FFFFFF', '#FFFFFF']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {ORBS.map((orb) => (
        <AnimatedOrb
          key={`${orb.top}-${orb.left ?? orb.right ?? orb.bottom}`}
          {...orb}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
