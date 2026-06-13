import React, { useCallback, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const SCREEN_W = Dimensions.get('window').width;
const SIDE_INSET = 12;
const BTN_W = 168;
const MAX_X = Math.max(0, (SCREEN_W - BTN_W) / 2 - SIDE_INSET);
const MAX_UP = 520;
const MAX_DOWN = 40;

function clampX(x) {
  'worklet';
  return Math.min(Math.max(x, -MAX_X), MAX_X);
}

function clampY(y) {
  'worklet';
  return Math.min(Math.max(y, -MAX_UP), MAX_DOWN);
}

/**
 * Hold and drag to reposition; quick tap opens directions.
 */
export default function FloatingDirectionsButton({
  visible = false,
  onPress,
  bottomOffset = 84,
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  useEffect(() => {
    if (!visible) {
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [visible, translateX, translateY]);

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = clampX(startX.value + event.translationX);
      translateY.value = clampY(startY.value + event.translationY);
    })
    .onEnd((event) => {
      const isTap =
        Math.abs(event.translationX) < 8 &&
        Math.abs(event.translationY) < 8;
      if (isTap) {
        runOnJS(handlePress)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.button, animatedStyle]}
          accessibilityRole="button"
          accessibilityLabel="Get directions. Hold and drag to move."
        >
          <Feather name="map" size={16} color="#FF7A00" />
          <Text style={styles.label}>Get Directions</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    elevation: 50,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FFD9C2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#FF7A00',
  },
});
