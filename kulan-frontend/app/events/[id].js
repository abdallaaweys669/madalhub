import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- FIX: Using the new '@/' path alias ---
import { events } from '@/data/events';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import EventHeader from '@/components/eventDetail/EventHeader';
import EventInfo from '@/components/eventDetail/EventInfo';
import EventAbout from '@/components/eventDetail/EventAbout';
import EventActions from '@/components/eventDetail/EventActions';
import EventComments from '@/components/eventDetail/EventComments';

// Mock data (can be moved or fetched later)
const attendees = [ { uri: 'https://i.pravatar.cc/150?img=5' }, { uri: 'https://i.pravatar.cc/150?img=8' }, { uri: 'https://i.pravatar.cc/150?img=3' }, ];
const comments = [ { id: '1', name: 'Aisha Hassan', time: '2h', text: 'Looking forward to meeting everyone!', image: { uri: 'https://i.pravatar.cc/150?img=5' } }, ];

const EventDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const event = events.find((e) => e.id === id);

  const { savedEventIds, toggleSavedEvent } = useSavedEvents();
  const isSaved = event ? savedEventIds.includes(event.id) : false;

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Event not found!</Text>
      </SafeAreaView>
    );
  }
  
  let date = '';
  let location = '';
  if (event.details) {
    const parts = event.details.split('·').map(item => item.trim());
    date = parts[0] || '';
    location = parts[1] || '';
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <EventHeader 
          event={event}
          isSaved={isSaved}
          onBack={() => router.back()}
          onSave={() => toggleSavedEvent(event.id)}
        />
        <View style={styles.contentContainer}>
          <EventInfo title={event.title} date={date} location={location} />
          <EventAbout description={event.description} />
          <EventActions attendees={attendees} />
          <EventComments comments={comments} currentUserImage={attendees[2]} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EventDetailScreen;