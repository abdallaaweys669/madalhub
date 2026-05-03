import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { styles } from '../constants/home.styles';
import { useSavedEvents } from '../context/SavedEventsContext';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';

const CarouselCard = ({ event }) => {
  const router = useRouter();
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();

  if (!event || !event.id) {
    return null;
  }

  const isSaved = savedEventIds.includes(event.id);

  const handleCardPress = () => {
    router.push(`/events/${event.id}`);
  };

  const handleBookmarkPress = (e) => {
    e.stopPropagation();
    if (isSaved) {
      unsaveEvent(event.id);
    } else {
      saveEvent(event.id);
    }
  };
  
  // --- THIS IS THE FIX for "undefined" ---
  // Safely parse the 'details' string into date and time.
  // Provides default values if 'details' is missing.
  const [date, time] = event.details ? event.details.split('·').map(item => item.trim()) : ['Date N/A', 'Time N/A'];

  return (
    <TouchableOpacity onPress={handleCardPress} style={styles.carouselCard}>
      {event.coverImageUrl ? (
        <Image source={{ uri: event.coverImageUrl }} style={styles.carouselCardImage} />
      ) : (
        <CoverPlaceholder
          letter={event.coverLetter ?? event.title}
          gradient={event.coverGradient ?? DEFAULT_COVER_GRADIENT}
          borderRadius={16}
          style={styles.carouselCardImage}
          letterSize={36}
        />
      )}
      
      <TouchableOpacity style={styles.carouselCardBookmarkIcon} onPress={handleBookmarkPress}>
        <Feather name="bookmark" size={20} color={isSaved ? '#0047FF' : '#333'} />
      </TouchableOpacity>
      
      <View style={styles.carouselCardContent}>
        <Text style={styles.carouselCardTitle} numberOfLines={1}>{event.title}</Text>
        {/* This will now display the correct date and time */}
        <Text style={styles.carouselCardDetails} numberOfLines={1}>{`${date} · ${time}`}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default CarouselCard;