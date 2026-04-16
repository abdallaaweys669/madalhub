import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';

// --- Reusing your existing data and components ---
import Chip from '@/features/onboarding/components/Chip';
import { GROUPS } from '@/features/onboarding/data/interestsGroups';
import { INTEREST_ICON_MAP } from '@/features/onboarding/data/interestIconMap';

const MIN_SELECT = 4;
const USER_INTERESTS = ['Fashion', 'Travel', 'AI'];

const ManageInterestsScreen = () => {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState(new Set(USER_INTERESTS));

  const toggleInterest = (interestKey) => {
    const newInterests = new Set(selectedInterests);
    if (newInterests.has(interestKey)) {
      newInterests.delete(interestKey);
    } else {
      newInterests.add(interestKey);
    }
    setSelectedInterests(newInterests);
  };

  const handleSave = () => {
    const interestsArray = Array.from(selectedInterests);
    console.log('Saving and passing back interests:', interestsArray);

    // Navigate back to the profile tab and pass the updated interests as a parameter
    router.push({
        pathname: '/(tabs)/profile',
        params: { updatedInterests: JSON.stringify(interestsArray) }
    });
  };

  const canSave = selectedInterests.size >= MIN_SELECT;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Manage Interests' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>What are you interested in?</Text>
          <Text style={styles.subtitle}>Add interests to your profile to help us personalize your feed.</Text>
          <View style={styles.counterContainer}>
            <Text style={styles.counterLabel}>Choose at least {MIN_SELECT} interests</Text>
            <Text style={styles.counterValue}>{selectedInterests.size} selected</Text>
          </View>
        </View>

        {GROUPS.map((category) => (
          <View key={category.title} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <View style={styles.interestsGrid}>
              {category.items.map((interest) => {
                const isSelected = selectedInterests.has(interest.key);
                return (
                  <Chip
                    key={interest.key}
                    label={interest.key}
                    icon={interest.icon}
                    iconSpec={INTEREST_ICON_MAP[interest.key]}
                    selected={isSelected}
                    onPress={() => toggleInterest(interest.key)}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.disabledButton]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  counterContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  counterLabel: { fontSize: 14, color: '#64748B' },
  counterValue: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  categorySection: { paddingHorizontal: 24, marginTop: 16 },
  categoryTitle: { fontSize: 14, color: '#0F172A', fontWeight: '700', marginBottom: 10 },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  saveButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center' },
  disabledButton: { backgroundColor: '#A9A9A9' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ManageInterestsScreen;