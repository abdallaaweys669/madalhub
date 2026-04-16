import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton, { SkeletonPiece } from '../Skeleton'; // Import our tools

/**
 * This component defines the skeleton layout specifically for the Explore screen.
 * It mimics a vertical list of event cards.
 */
const ExploreSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Each card is wrapped in a Skeleton to have its own shimmer animation */}
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} containerStyle={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Image Placeholder */}
            <SkeletonPiece width={80} height={80} style={{ borderRadius: 8 }} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              {/* Text Placeholders */}
              <SkeletonPiece width="70%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonPiece width="50%" height={12} style={{ marginBottom: 8 }} />
              <SkeletonPiece width="80%" height={12} />
            </View>
          </View>
        </Skeleton>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'transparent', // The wrapper is transparent
  },
});

export default ExploreSkeleton;