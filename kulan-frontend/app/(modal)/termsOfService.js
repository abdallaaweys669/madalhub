import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

const TermsOfServiceScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <View style={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.date}>Last updated: October 3, 2025</Text>
        <Text style={styles.paragraph}>
          Welcome to our Event App. By using our application, you agree to comply with and be bound by the following terms and conditions. Please review them carefully.
        </Text>
        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing this app, you are agreeing to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
        </Text>
        <Text style={styles.heading}>2. User Conduct</Text>
        <Text style={styles.paragraph}>
          You agree not to use the app to post or transmit any material which is threatening, defamatory, obscene, or otherwise unlawful. You are solely responsible for the content you create and post.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  date: { fontSize: 14, color: '#888', marginBottom: 20 },
  heading: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  paragraph: { fontSize: 16, color: '#333', lineHeight: 24 },
});

export default TermsOfServiceScreen;