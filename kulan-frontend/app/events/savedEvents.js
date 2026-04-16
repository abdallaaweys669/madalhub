import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';

// --- THE FIX ---
import { useSavedEvents } from '../../src/context/SavedEventsContext'; // 1. Import the context hook
import { events as allEvents } from '../../src/data/events'; // 2. Import ALL events from your main data file

const SavedEventsScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Upcoming');

  const { savedEventIds } = useSavedEvents();
  const savedEventsData = allEvents.filter(event => savedEventIds.includes(event.id));

  const navigateToDetail = (event) => {
    router.push(`/events/${event.id}`);
  };

  const SavedEventItem = ({ event }) => (
    <TouchableOpacity onPress={() => navigateToDetail(event)} style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTime}>{event.details.split('·')[0].trim()}</Text>
        <Text style={styles.itemTitle}>{event.title}</Text>
        <Text style={styles.itemLocation}>{event.details.split('·')[1].trim()}</Text>
      </View>
      <Image source={event.image} style={styles.itemImage} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Saved', headerBackTitle: 'Profile' }} />
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Upcoming' && styles.activeTab]} onPress={() => setActiveTab('Upcoming')}><Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>Upcoming</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Past' && styles.activeTab]} onPress={() => setActiveTab('Past')}><Text style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>Past</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {activeTab === 'Upcoming' && savedEventsData.length > 0 ? (
          savedEventsData.map(event => <SavedEventItem key={event.id} event={event} />)
        ) : (
          <Text style={styles.emptyStateText}>You have no upcoming saved events.</Text>
        )}
        {activeTab === 'Past' && <Text style={styles.emptyStateText}>You have no past saved events.</Text>}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 25, margin: 16, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  activeTab: { backgroundColor: '#fff' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#555' },
  activeTabText: { color: '#000' },
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemTextContainer: { flex: 1, marginRight: 15 },
  itemTime: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },
  itemTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  itemLocation: { fontSize: 14, color: '#888' },
  itemImage: { width: 80, height: 80, borderRadius: 12 },
  emptyStateText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
});

export default SavedEventsScreen;