import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Alert, Image, Modal, Button } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = ['Book Club', 'Language Exchange', 'Cooking Class', 'Tech Meetup', 'Music Festival', 'Art Workshop'];

const CreateEventScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [eventToEdit, setEventToEdit] = useState(null);
  const isEditMode = !!eventToEdit;

  // Form state
  const [eventName, setEventName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  
  // DateTimePicker state
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');

  // Category Modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    if (params.event) {
      const parsedEvent = JSON.parse(params.event);
      setEventToEdit(parsedEvent);
      setEventName(parsedEvent.title);
      setCategory(parsedEvent.category || 'Book Club');
      setLocation(parsedEvent.location);
      setDescription(parsedEvent.description || '');
      setImage(parsedEvent.image);
      // A more robust app would parse the date string back into a Date object
      // For now, we'll just start with the current date for editing.
    }
  }, [params.event]);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShowPicker(true);
    setPickerMode(currentMode);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!eventName || !category || !date || !location) {
      Alert.alert('Missing Information', 'Please fill out all required fields.');
      return;
    }

    const eventData = {
      id: isEditMode ? eventToEdit.id : Date.now(),
      title: eventName,
      category,
      date: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      location,
      description,
      image: image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&q=80',
    };
    
    router.push({ pathname: '/events/myEvents', params: { savedEvent: JSON.stringify(eventData) } });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Stack.Screen options={{ title: isEditMode ? 'Edit Event' : 'Create Event', headerBackTitle: 'My Events' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TextInput style={styles.input} placeholder="Event Name" value={eventName} onChangeText={setEventName} />
        
        <TouchableOpacity style={styles.inputPicker} onPress={() => setCategoryModalVisible(true)}>
          <Text style={styles.pickerText}>{category || 'Select Category'}</Text>
          <Feather name="chevron-down" size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.inputPicker} onPress={() => showMode('date')}>
          <Text style={styles.pickerText}>{date.toLocaleString()}</Text>
        </TouchableOpacity>
        
        <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Event Description (optional)" value={description} onChangeText={setDescription} multiline />

        <Text style={styles.uploadTitle}>Upload Image</Text>
        <TouchableOpacity style={styles.uploadContainer} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <>
              <Text style={styles.uploadText}>Upload Event Cover Image</Text>
              <View style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>Upload</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={pickerMode}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Category</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat} style={styles.categoryItem} onPress={() => { setCategory(cat); setCategoryModalVisible(false); }}>
                <Text style={styles.categoryText}>{cat}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" onPress={() => setCategoryModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{isEditMode ? 'Save Changes' : 'Create Event'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  input: { backgroundColor: '#f0f2f5', borderRadius: 12, padding: 18, fontSize: 16, marginBottom: 15 },
  inputPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f2f5', borderRadius: 12, padding: 18, marginBottom: 15 },
  pickerText: { fontSize: 16, color: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  uploadTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  uploadContainer: { borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 150, overflow: 'hidden' },
  uploadText: { fontSize: 16, color: '#888', marginBottom: 15 },
  uploadButton: { backgroundColor: '#e0e0e0', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  uploadButtonText: { fontSize: 14, fontWeight: '600' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  footer: { padding: 20, backgroundColor: '#fff' },
  saveButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '80%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  categoryItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  categoryText: { textAlign: 'center', fontSize: 18 },
});

export default CreateEventScreen;