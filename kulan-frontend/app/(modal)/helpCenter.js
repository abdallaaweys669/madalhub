import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

const FAQItem = ({ question, answer }) => (
  <View style={styles.faqItem}>
    <Text style={styles.question}>{question}</Text>
    <Text style={styles.answer}>{answer}</Text>
  </View>
);

const HelpCenterScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Help Center' }} />
      <View style={styles.content}>
        <FAQItem
          question="How do I join an event?"
          answer="Navigate to the event details page and tap the 'Join Event' button. You will receive a confirmation once you've successfully joined."
        />
        <FAQItem
          question="How can I create my own event?"
          answer="From the profile screen, go to the 'My Events' tab and tap the 'Create New Event' button. Follow the on-screen instructions to set up your event."
        />
        <FAQItem
          question="How do I change my password?"
          answer="You can change your password by going to Settings > Change Password. You will need to enter your current password to set a new one."
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  faqItem: {
    marginBottom: 25,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  answer: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default HelpCenterScreen;