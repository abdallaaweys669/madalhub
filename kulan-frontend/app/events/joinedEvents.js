import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

const initialJoinedEvents = [
  { id: '1', status: 'Upcoming', title: 'Somali Book Club', details: 'Sat, Jul 20 · 10:00 AM · Mogadishu', image: 'https://images.unsplash.com/photo-1529156069898-fac515345096?w=500&q=80' },
  { id: '2', status: 'Upcoming', title: 'Somali Language Exchange', details: 'Sun, Jul 21 · 2:00 PM · Hargeisa', image: 'https://images.unsplash.com/photo-1531549240141-48704da8099e?w=500&q=80' },
  { id: '4', status: 'Past', title: 'Somali Poetry Night', details: 'Tue, Jul 23 · 7:00 PM · Baidoa', image: 'https://images.unsplash.com/photo-1522878129833-23f99d08e9e9?w=500&q=80' },
];

const JoinedEventsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [joinedEvents, setJoinedEvents] = useState(initialJoinedEvents);

  useEffect(() => {
    if (params.leavedEventId) {
      setJoinedEvents(prevEvents => prevEvents.filter(event => event.id !== params.leavedEventId));
    }
  }, [params.leavedEventId]);

  const navigateToDetail = (event) => {
    const isPast = event.status === 'Past';
    router.push({
      // --- CORRECTED PATH ---
      pathname: `/events/${event.id}`,
      params: { isJoined: 'true', isPast: isPast.toString() },
    });
  };

  const JoinedEventItem = ({ event }) => (
    <TouchableOpacity onPress={() => navigateToDetail(event)} style={styles.itemContainer}>
      <View style={styles.itemTextContainer}><Text style={styles.itemStatus}>{event.status}</Text><Text style={styles.itemTitle}>{event.title}</Text><Text style={styles.itemDetails}>{event.details}</Text></View>
      <Image source={{ uri: event.image }} style={styles.itemImage} />
    </TouchableOpacity>
  );

  const upcomingEvents = joinedEvents.filter(e => e.status !== 'Past');
  const pastEvents = joinedEvents.filter(e => e.status === 'Past');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Joined Events', headerBackTitle: 'Profile' }} />
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Upcoming' && styles.activeTab]} onPress={() => setActiveTab('Upcoming')}><Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>Upcoming</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Past' && styles.activeTab]} onPress={() => setActiveTab('Past')}><Text style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>Past</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {activeTab === 'Upcoming' && upcomingEvents.map(event => <JoinedEventItem key={event.id} event={event} />)}
        {activeTab === 'Past' && (pastEvents.length > 0 ? pastEvents.map(event => <JoinedEventItem key={event.id} event={event} />) : <Text style={styles.emptyStateText}>You have no past joined events.</Text>)}
      </ScrollView>
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
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemTextContainer: { flex: 1, marginRight: 15 },
  itemStatus: { fontSize: 14, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  itemTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  itemDetails: { fontSize: 14, color: '#888' },
  itemImage: { width: 80, height: 80, borderRadius: 12 },
  emptyStateText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
});

export default JoinedEventsScreen;