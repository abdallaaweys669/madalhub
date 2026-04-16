import React from 'react';
import { Text, Image, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- THIS IS THE FIX ---
// The path is now '../' because 'components' and 'context' are sibling folders.
import { useSavedEvents } from '../context/SavedEventsContext'; 

// This path is also likely wrong if 'Constants' is not inside 'components'
// Assuming 'Constants' is also at the root, it should be:
import { styles } from '../constants/explore_styles/explore.styles';

const EventCard = ({ event }) => {
  const router = useRouter();
  
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();
  
  if (!event) {
    return null;
  }

  const isSaved = savedEventIds.includes(event.id);

  const handleBookmarkToggle = () => {
    if (isSaved) {
      unsaveEvent(event.id);
    } else {
      saveEvent(event.id);
    }
  };

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <Image source={event.image} style={styles.eventCardImage} />
      <View style={styles.eventCardContent}>
        <Text style={styles.eventCardTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.eventCardLocation}>{event.location}</Text>
        <Text style={styles.eventCardDetails}>{`${event.date} · ${event.time}`}</Text>
      </View>
      <TouchableOpacity onPress={handleBookmarkToggle} style={styles.bookmarkButton}>
        <Ionicons 
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={22} 
          color={isSaved ? "#007bff" : "#333"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default EventCard;