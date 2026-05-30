import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SkeletonPiece = ({ width, height, style }) => (
  <View style={[{ width, height, backgroundColor: '#e0e0e0', borderRadius: 4 }, style]} />
);

const AnimatedSkeletonLoader = () => {
  // Create an animated value, starting at -1
  const shimmerAnimation = useRef(new Animated.Value(-1)).current;

  // Run the animation on a loop when the component mounts
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1, // Animate from -1 to 1
        duration: 1200, // Speed of the shimmer
        useNativeDriver: true, // for better performance
      })
    ).start();
  }, []);

  // Create a style that will move the gradient from left to right
  const animatedStyle = {
    transform: [
      {
        translateX: shimmerAnimation.interpolate({
          inputRange: [-1, 1],
          outputRange: [-250, 250], // Move across the width of a card
        }),
      },
    ],
  };

  return (
    <View style={styles.carouselContainer}>
      <SkeletonPiece width={150} height={20} style={{ marginBottom: 16 }} />
      
      <View style={{ flexDirection: 'row' }}>
        {[1, 2].map((i) => ( // Create two skeleton cards
          <View key={i} style={styles.card}>
            <View style={styles.cardImage} />
            <View style={{ padding: 12 }}>
              <SkeletonPiece width="80%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonPiece width="60%" height={12} />
            </View>
            {/* The animated shimmer overlay */}
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
              <LinearGradient
                colors={['#e0e0e0', '#f0f0f0', '#e0e0e0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  card: {
    width: 220,
    marginRight: 16,
    backgroundColor: '#e0e0e0', // Base color
    borderRadius: 12,
    overflow: 'hidden', // This is crucial to contain the shimmer
  },
  cardImage: {
    height: 100,
    backgroundColor: '#e0e0e0',
  },
});

export default AnimatedSkeletonLoader;