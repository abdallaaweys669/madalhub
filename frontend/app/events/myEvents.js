import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Feather } from '@expo/vector-icons';

const initialEvents = [
  { id: 1, title: 'Somali Book Club', date: 'Sat, Jul 20', time: '10:00 AM', location: 'Mogadishu', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500&q=80' },
  { id: 2, title: 'Somali Language Exchange', date: 'Sun, Jul 21', time: '2:00 PM', location: 'Hargeisa', image: 'https://images.unsplash.com/photo-1534352229549-469DSKFJSLKDFJLSKJDF?w=500&q=80' },
  { id: 3, title: 'Somali Cooking Class', date: 'Mon, Jul 22', time: '6:00 PM', location: 'Kismayo', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80' },
];

const MyEventsScreen = () => {
  const router = useGuardedRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [events, setEvents] = useState(initialEvents);

  // Listen for new or updated events from the create/edit screen
  useEffect(() => {
    if (params.savedEvent) {
      const savedEvent = JSON.parse(params.savedEvent);
      const existingIndex = events.findIndex(e => e.id === savedEvent.id);
      if (existingIndex > -1) {
        // Update existing event
        const updatedEvents = [...events];
        updatedEvents[existingIndex] = savedEvent;
        setEvents(updatedEvents);
      } else {
        // Add new event
        setEvents(prevEvents => [savedEvent, ...prevEvents]);
      }
    }
  }, [params.savedEvent]);

  const handleDelete = (eventId) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
          },
        },
      ]
    );
  };

  const EventCard = ({ event }) => (
    <View style={styles.card}>
      <Image source={{ uri: event.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{event.title}</Text>
          <Text style={styles.cardDetails}>{`${event.date} · ${event.time} · ${event.location}`}</Text>
        </View>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/events/createEvent', params: { event: JSON.stringify(event) } })}>
            <Feather name="edit" size={22} color="#333" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(event.id)}>
            <Feather name="trash-2" size={22} color="#E53935" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Events', headerBackTitle: 'Profile' }} />
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Upcoming' && styles.activeTab]} onPress={() => setActiveTab('Upcoming')}>
          <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Past' && styles.activeTab]} onPress={() => setActiveTab('Past')}>
          <Text style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>Past</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {activeTab === 'Upcoming' && events.map(event => <EventCard key={event.id} event={event} />)}
        {activeTab === 'Past' && <Text style={styles.emptyStateText}>You have no past events.</Text>}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/events/createEvent')}>
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 25, margin: 16, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 15, fontWeight: '600', color: '#555' },
  activeTabText: { color: '#000' },
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cardImage: { width: '100%', height: 150 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardTextContainer: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardDetails: { fontSize: 14, color: '#666' },
  iconContainer: { flexDirection: 'row' },
  icon: { marginHorizontal: 8 },
  emptyStateText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
});

export default MyEventsScreen;