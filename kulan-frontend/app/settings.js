import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

const SettingsScreen = () => {
  const router = useRouter();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const SettingItem = ({ icon, name, isSwitch, value, onValueChange, onPress }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.item}>
      <View style={styles.itemLeft}>
        <Feather name={icon} size={22} color="#555" />
        <Text style={styles.itemText}>{name}</Text>
      </View>
      {isSwitch ? (
        <Switch value={value} onValueChange={onValueChange} />
      ) : (
        onPress && <Feather name="chevron-right" size={22} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Settings', headerBackTitle: 'Profile' }} />
      <ScrollView>
        {/* --- Account Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem icon="edit-3" name="Edit Profile" onPress={() => router.push('/(modal)/editProfile')} />
          <SettingItem icon="lock" name="Change Password" onPress={() => router.push('/(modal)/changePassword')} />
          <SettingItem icon="star" name="Manage Interests" onPress={() => router.push('/(modal)/manageInterests')} />
        </View>

        {/* --- Notifications Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingItem
            icon="bell"
            name="Push Notifications"
            isSwitch
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <SettingItem
            icon="mail"
            name="Email Notifications"
            isSwitch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />
        </View>

        {/* --- Support Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <SettingItem icon="help-circle" name="Help Center" onPress={() => router.push('/(modal)/helpCenter')} />
          <SettingItem icon="file-text" name="Terms of Service" onPress={() => router.push('/(modal)/termsOfService')} />
          <SettingItem icon="shield" name="Privacy Policy" onPress={() => router.push('/(modal)/privacyPolicy')} />
        </View>

        {/* --- Logout --- */}
        <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    marginLeft: 15,
  },
  logoutButton: {
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
  },
  logoutButtonText: {
      color: '#ff3b30',
      fontSize: 16,
      fontWeight: '600',
  }
});

export default SettingsScreen;