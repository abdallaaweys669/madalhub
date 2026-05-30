import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import useGuardedRouter from '@/hooks/useGuardedRouter';

const notifications = [
  {
    id: 1,
    type: 'event_reminder',
    title: 'Your event Tech Meetup starts in 2h',
    time: 'Today',
    icon: 'calendar-outline',
    category: 'Today',
  },
  {
    id: 2,
    type: 'new_event',
    title: 'New event in your interest Sports',
    time: '2d',
    icon: 'basketball-outline',
    category: 'Earlier this week',
  },
  {
    id: 3,
    type: 'invitation',
    title: 'Abdi invited you to join Cultural Night.',
    time: '3d',
    icon: 'people-outline',
    category: 'Earlier this week',
  },
];

const NotificationsScreen = () => {
  const { user } = useAuth();
  const router = useGuardedRouter();
  const [profileCardDismissed, setProfileCardDismissed] = useState(false);

  const phone = String(user?.phone ?? user?.phoneNumber ?? '').trim();
  const showProfileCard = !phone && !profileCardDismissed;

  const todayNotifications = notifications.filter(n => n.category === 'Today');
  const earlierNotifications = notifications.filter(n => n.category === 'Earlier this week');

  useFocusEffect(
    useCallback(() => {
      setProfileCardDismissed(false);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#FFFFFF');
        StatusBar.setTranslucent(false);
      }
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity>
          <Feather name="settings" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {showProfileCard ? (
          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.85}
            onPress={() => router.push('/(modal)/editProfile')}
          >
            <View style={styles.profileCardIconWrap}>
              <Ionicons name="person-circle-outline" size={28} color="#FF7A00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileCardTitle}>Complete your profile</Text>
              <Text style={styles.profileCardSub}>Add your phone number so organizers can reach you.</Text>
            </View>
            <TouchableOpacity
              hitSlop={10}
              onPress={(e) => { e.stopPropagation(); setProfileCardDismissed(true); }}
            >
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          {todayNotifications.map(notification => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationIcon}>
                <Ionicons name={notification.icon} size={24} color="#888" />
              </View>
              <View style={styles.notificationTextContainer}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earlier this week</Text>
          {earlierNotifications.map(notification => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationIcon}>
                <Ionicons name={notification.icon} size={24} color="#888" />
              </View>
              <View style={styles.notificationTextContainer}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationIcon: {
    marginRight: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
  },
  notificationTime: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  profileCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE8CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C2410C',
    marginBottom: 2,
  },
  profileCardSub: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 17,
  },
});

export default NotificationsScreen;