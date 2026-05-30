import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * A single, reusable piece of a skeleton layout.
 * Use this to build the shapes of your skeleton.
 */
export const SkeletonPiece = ({ width, height, style }) => (
  <View style={[{ width, height, backgroundColor: '#e0e0e0', borderRadius: 4 }, style]} />
);

/**
 * A wrapper component that provides a shimmer animation.
 * Place your skeleton layout inside this component.
 */
const Skeleton = ({ children, containerStyle }) => {
  const shimmerAnimation = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // This creates an infinitely looping animation
    Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // This style will move the gradient from left to right
  const animatedStyle = {
    transform: [
      {
        translateX: shimmerAnimation.interpolate({
          inputRange: [-1, 1],
          outputRange: [-350, 350], // Adjust this width to cover your widest layout
        }),
      },
    ],
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* This is where your actual layout will be rendered */}
      {children}

      {/* This is the animated shimmer overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          // The gradient colors create the shimmer effect
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden', // This is crucial to contain the shimmer effect
    backgroundColor: '#e0e0e0', // The base color for the skeleton shapes
  },
});

export default Skeleton;