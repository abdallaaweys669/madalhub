import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import useAuth from '@/auth/useAuth';

// --- Import shared components and data ---
import Chip from '@/features/onboarding/components/Chip';
import { INTEREST_ICON_MAP } from '@/features/onboarding/data/interestIconMap';

const initialUser = {
  name: 'Abdi',
  email: 'abdi.a@email.com',
  bio: 'Event enthusiast | Tech lover | Music aficionado. Exploring the world one event at a time.',
  profilePic: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=500&h=500&fit=crop',
  interests: ['Tech', 'Music', 'Art', 'Sports'], // Initial interests
};

const NavigationItem = ({ href, title }) => (
  <Link href={href} asChild>
    <TouchableOpacity style={styles.navItem}>
      <Text style={styles.navItemText}>{title}</Text>
      <Feather name="chevron-right" size={22} color="#BDBDBD" />
    </TouchableOpacity>
  </Link>
);

const ProfileScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const [userInterests, setUserInterests] = useState(new Set(initialUser.interests));

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#FFFFFF');
        StatusBar.setTranslucent(false);
      }
    }, []),
  );

  useEffect(() => {
    if (params.updatedInterests) {
      const interests = JSON.parse(params.updatedInterests);
      setUserInterests(new Set(interests));
    }
  }, [params.updatedInterests]);

  const handleRemoveInterest = (interestToRemove) => {
    const newInterests = new Set(userInterests);
    newInterests.delete(interestToRemove);
    setUserInterests(newInterests);
  };

  const handleLogout = async () => {
    await auth.logout();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Link href="/settings" asChild>
            <TouchableOpacity style={styles.settingsButton}>
                <Feather name="settings" size={24} color="#333" />
            </TouchableOpacity>
        </Link>
        <Image source={{ uri: initialUser.profilePic }} style={styles.profilePic} />
        <Text style={styles.name}>{initialUser.name}</Text>
        <Text style={styles.email}>{initialUser.email}</Text>
        <Text style={styles.bio}>{initialUser.bio}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.interestsContainer}>
          {Array.from(userInterests).map((interest) => (
            <View key={interest} style={styles.chipWrapper}>
              <Chip
                label={interest}
                iconSpec={INTEREST_ICON_MAP[interest]}
                selected={true}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveInterest(interest)}
              >
                <Feather name="x" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <Link href="/(modal)/manageInterests" asChild>
            <TouchableOpacity style={styles.addInterestPill}>
                <Text style={styles.addInterestText}>Add</Text>
                <Feather name="plus" size={16} color="#333" />
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <View style={styles.section}>
        <NavigationItem href="/events/myEvents" title="My Events" />
        <NavigationItem href="/events/joinedEvents" title="Joined Events" />
        <NavigationItem href="/events/savedEvents" title="Saved Events" />
        <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
          <Feather name="log-out" size={20} color="#E65A3A" />
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 30, backgroundColor: '#f8f9fa', paddingHorizontal: 30 },
  settingsButton: { position: 'absolute', top: 12, right: 20, zIndex: 1 },
  profilePic: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  name: { fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  email: { fontSize: 16, color: '#888', marginTop: 4 },
  bio: { fontSize: 15, color: '#666', textAlign: 'center', marginTop: 15, lineHeight: 22 },
  section: { paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, paddingTop: 10 },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  chipWrapper: {
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addInterestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  addInterestText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
  },
  navItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  navItemText: { fontSize: 18, fontWeight: '500' },
  logoutItem: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFF4F1',
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E65A3A',
  },
});

export default ProfileScreen;