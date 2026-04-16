import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

const EditProfileScreen = () => {
  const router = useRouter();

  // --- State to manage form inputs ---
  const [name, setName] = useState('Abdi');
  const [bio, setBio] = useState('Event enthusiast | Tech lover | Music aficionado. Exploring the world one event at a time.');

  const handleSaveChanges = () => {
    // Here you would typically send the data to your backend API
    const updatedProfile = {
      name,
      bio,
    };
    console.log('Saving changes:', updatedProfile);

    // Show a confirmation alert and navigate back
    Alert.alert(
      'Profile Updated',
      'Your changes have been saved successfully.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled" // Keeps keyboard open on tap
      >
        {/* --- Profile Picture Section --- */}
        <View style={styles.profilePicSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=500&h=500&fit=crop' }}
            style={styles.profilePic}
          />
          <TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* --- Form Section --- */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]} // Style for non-editable fields
              value="abdi.a@email.com"
              placeholder="Enter your email"
              keyboardType="email-address"
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              multiline
            />
          </View>
        </View>
      </ScrollView>
      {/* --- Footer with Save Button --- */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profilePicSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
  },
  formSection: {
    padding: 20,
    marginTop: 10,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
  },
  readOnlyInput: {
      color: '#888', // Grey out text for non-editable fields
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;