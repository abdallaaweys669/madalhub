import React, { useState, useMemo, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Using clean path aliases for all imports
import { styles } from '@/constants/explore_styles/explore.styles';
import EventCard from '@/components/EventCard';
import { events as allEventsData } from '@/data/events';
import ExploreSkeleton from '@/components/skeletons/ExploreSkeleton';

const categories = [
  { name: 'All', icon: <Feather name="globe" size={16} color="#333" /> },
  { name: 'Tech', icon: <Feather name="code" size={16} color="#333" /> },
  { name: 'Culture', icon: <MaterialCommunityIcons name="theater" size={16} color="#333" /> },
  { name: 'Poetry', icon: <MaterialCommunityIcons name="pen" size={16} color="#333" /> },
  { name: 'Speaking', icon: <Ionicons name="mic-outline" size={16} color="#333" /> },
];

const allEvents = allEventsData.map((event, index) => {
  if (!event || !event.details) return null;
  const parts = event.details.split('·');
  const dateTimePart = parts[0]?.trim();
  const location = parts[1]?.trim();
  const lastCommaIndex = dateTimePart.lastIndexOf(',');
  const date = dateTimePart.substring(0, lastCommaIndex).trim();
  const time = dateTimePart.substring(lastCommaIndex + 1).trim();
  return {
    ...event,
    date,
    time,
    location,
    category: categories[(index % (categories.length - 1)) + 1].name,
  };
}).filter(Boolean);

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      if (!event || !event.title) return false;
      const categoryMatch = activeCategory === 'All' || event.category === activeCategory;
      const searchMatch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [searchQuery, activeCategory]);

  const handleFilterPress = () => {
    Alert.alert("Filter", "Filter functionality will be implemented soon!");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#6c757d" style={styles.searchIcon} />
            <TextInput
              placeholder="Search events, categories..."
              placeholderTextColor="#6c757d"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
            <Ionicons name="options-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[styles.categoryChip, activeCategory === category.name && styles.activeCategoryChip]}
                onPress={() => setActiveCategory(category.name)}
              >
                {category.icon}
                <Text style={styles.categoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <ExploreSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#6c757d" style={styles.searchIcon} />
          <TextInput
            placeholder="Search events, categories..."
            placeholderTextColor="#6c757d"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[styles.categoryChip, activeCategory === category.name && styles.activeCategoryChip]}
              onPress={() => setActiveCategory(category.name)}
            >
              {category.icon}
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.eventsList}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Feather name="search" size={40} color="#adb5bd" />
            <Text style={styles.emptyStateText}>No events found matching your criteria.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} // This is now the correct final brace