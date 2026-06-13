import React from 'react';
import { View, Text, FlatList } from 'react-native';
// --- THIS IS THE FIX ---
// Explicitly import and use CarouselCard
import CarouselCard from './CarouselCard'; 
import { styles } from '../constants/home.styles';
import EmptyState from './EmptyState';

const EventCarousel = ({ title, data }) => {
  if (!data || data.length === 0) {
    if (title === "Saved Events") {
      return (
        <View style={styles.carouselContainer}>
          <Text style={styles.carouselTitle}>{title}</Text>
          <EmptyState 
            title="No Saved Events"
            message="Tap the bookmark icon on an event to save it here."
            icon="bookmark"
          />
        </View>
      );
    }
    return null;
  }

  return (
    <View style={styles.carouselContainer}>
      <Text style={styles.carouselTitle}>{title}</Text>
      <FlatList
        data={data}
        // Pass the item as a prop named "event" to our new card
        renderItem={({ item }) => <CarouselCard event={item} />} 
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      />
    </View>
  );
};

export default EventCarousel;