import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton, { SkeletonPiece } from '../Skeleton'; // Import our new tools

/**
 * This component defines the skeleton layout specifically for the Home screen.
 */
const HomeSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Each major section (like a carousel) is wrapped in the main Skeleton component */}
      <Skeleton containerStyle={styles.carouselContainer}>
        {/* We set containerStyle to transparent because the SkeletonPieces will provide the color */}
        <SkeletonPiece width={150} height={20} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row' }}>
          <View style={styles.card}>
            <SkeletonPiece width="100%" height={100} style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
            <View style={{ padding: 12 }}>
              <SkeletonPiece width="80%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonPiece width="60%" height={12} />
            </View>
          </View>
          <View style={styles.card}>
            <SkeletonPiece width="100%" height={100} style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
            <View style={{ padding: 12 }}>
              <SkeletonPiece width="80%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonPiece width="60%" height={12} />
            </View>
          </View>
        </View>
      </Skeleton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  carouselContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent', // The wrapper is transparent
  },
  card: {
    width: 220,
    marginRight: 16,
    // The card itself doesn't need a background color here
  },
});

export default HomeSkeleton;