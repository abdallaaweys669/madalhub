import React, { useState, useMemo } from 'react';
import {
  Text,
  View,
  StatusBar,
  FlatList,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, spacing } from '@/theme';
import { events as mockEvents } from '@/data/events';
import { useSavedEvents } from '@/context/SavedEventsContext';

import EventListCard from '@/components/EventListCard';
import EmptyState from '@/components/EmptyState';
import SearchBar from '@/components/SearchBar';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';

// --- Tab Filters Component ---
const EventTabs = ({ activeTab, onTabPress }) => {
  const colors = useThemeColors();
  const tabs = ['Upcoming', 'Going', 'Saved'];
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
      {tabs.map(tab => (
        <TouchableOpacity 
          key={tab} 
          onPress={() => onTabPress(tab)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginRight: 10,
            backgroundColor: activeTab === tab ? colors.primary : 'transparent',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: activeTab === tab ? colors.primary : colors.border,
          }}
        >
          <Text style={{ 
            color: activeTab === tab ? '#FFFFFF' : colors.textSecondary, 
            fontWeight: '600' 
          }}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// --- Main Screen ---
const HomeScreen = () => {
  const colors = useThemeColors();
  const colorScheme = useColorScheme(); 
  
  const [activeTab, setActiveTab] = useState('Upcoming');
  const { savedEventIds = [] } = useSavedEvents() || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);

  React.useEffect(() => {
    setTimeout(() => {
      setEvents(mockEvents);
      setIsLoading(false);
    }, 2000);
  }, []);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeData = useMemo(() => {
    switch (activeTab) {
      case 'Going':
        return filteredEvents.slice(2, 4);
      case 'Saved':
        return filteredEvents.filter(e => savedEventIds.includes(e.id));
      case 'Upcoming':
      default:
        return filteredEvents;
    }
  }, [activeTab, savedEventIds, filteredEvents]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <SearchBar query={searchQuery} onQueryChange={setSearchQuery} />
        <HomeSkeleton />
        <HomeSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <FlatList
        data={activeData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <EventListCard event={item} />}
        ListHeaderComponent={
          <>
            <SearchBar query={searchQuery} onQueryChange={setSearchQuery} />
            <EventTabs activeTab={activeTab} onTabPress={setActiveTab} />
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title={`No ${activeTab.toLowerCase()} events`}
            message="You don't have any events right now. Let's find some!"
            icon={<Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />}
          />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.lg }}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;