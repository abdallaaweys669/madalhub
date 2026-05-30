import React from 'react';
import { Text, Image, TouchableOpacity, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSavedEvents } from '@/context/SavedEventsContext';
import useAuth from '@/auth/useAuth';
import { styles } from '@/constants/explore_styles/explore.styles';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';

const EventCard = ({ event }) => {
  const router = useGuardedRouter();
  const { isLoggedIn } = useAuth();
  
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();
  
  if (!event) {
    return null;
  }

  const isSaved = savedEventIds.includes(event.id);

  const handleBookmarkToggle = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }

    if (isSaved) {
      unsaveEvent(event.id);
    } else {
      saveEvent(event.id);
    }
  };

  return (
    <TouchableOpacity
      style={styles.eventCard}
      activeOpacity={0.9}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={styles.eventCardContent}>
        <Text style={styles.eventCardTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.eventCardDetails}>{`${event.date} · ${event.time}`}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color="#7b7e8a" />
          <Text style={styles.eventCardLocation}>{event.location}</Text>
        </View>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            {[41, 33].map((img, idx) => (
              <Image
                key={img}
                source={{ uri: `https://i.pravatar.cc/100?img=${img}` }}
                style={[styles.eventAvatar, idx > 0 && { marginLeft: -8 }]}
              />
            ))}
            <Text style={styles.goingText}>{event.id === '1' ? '32 going' : `${20 + Number(event.id)} going`}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: event.location?.toLowerCase() === 'online' ? '#DFF7E7' : '#EFE9FF' }]}>
            <Text style={[styles.typeBadgeText, { color: event.location?.toLowerCase() === 'online' ? '#139E58' : '#6F57D9' }]}>
              {event.location?.toLowerCase() === 'online' ? 'Online' : 'In person'}
            </Text>
          </View>
        </View>
      </View>
      {event.coverImageUrl ? (
        <Image source={{ uri: event.coverImageUrl }} style={styles.eventCardImage} />
      ) : (
        <CoverPlaceholder
          letter={event.coverLetter ?? event.title}
          gradient={event.coverGradient ?? DEFAULT_COVER_GRADIENT}
          borderRadius={16}
          style={styles.eventCardImage}
          letterSize={34}
        />
      )}
      <TouchableOpacity onPress={handleBookmarkToggle} style={styles.bookmarkButton}>
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={18}
          color={isSaved ? '#FF7B3F' : '#7b7e8a'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default EventCard;