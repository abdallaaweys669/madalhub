import React from 'react';
// --- 1. Import 'useColorScheme' from react-native ---
import { View, Text, Image, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useThemeColors, spacing } from '@/theme';
import { useSavedEvents } from '@/context/SavedEventsContext';

const EventListCard = ({ event }) => {
  const router = useRouter();
  const colors = useThemeColors();
  // --- 2. Call the hook to get the current color scheme ---
  const colorScheme = useColorScheme(); 
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();

  if (!event) return null;

  const isSaved = savedEventIds.includes(event.id);
  const [date, time] = event.details ? event.details.split('·').map(item => item.trim()) : ['N/A', 'N/A'];

  const handleBookmarkToggle = () => {
    isSaved ? unsaveEvent(event.id) : saveEvent(event.id);
  };

  return (
    <TouchableOpacity 
      onPress={() => router.push(`/events/${event.id}`)}
      style={{
        marginHorizontal: spacing.lg,
        marginBottom: spacing.xl,
        backgroundColor: colors.card,
        borderRadius: 16,
        // --- 3. Now this logic will work correctly ---
        shadowColor: colorScheme === 'dark' ? 'rgba(255,123,63,0.3)' : '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      }}
    >
      <Image 
        source={event.image} 
        style={{ width: '100%', height: 150, borderTopLeftRadius: 16, borderTopRightRadius: 16 }} 
      />
      <View style={{ padding: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: 'bold', color: colors.text }}>
            {event.title}
          </Text>
          <TouchableOpacity onPress={handleBookmarkToggle} style={{ paddingLeft: spacing.md }}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={24} 
              color={isSaved ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Feather name="calendar" size={16} color={colors.textSecondary} />
            <Text style={{ marginLeft: spacing.sm, color: colors.textSecondary }}>
              {/* FIX: Use the full details string */}
              {event.details}
            </Text>
          </View>
          {/* FIX: Conditionally render the location */}
          {event.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Feather name="map-pin" size={16} color={colors.textSecondary} />
              <Text style={{ marginLeft: spacing.sm, color: colors.textSecondary }}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
export default EventListCard;