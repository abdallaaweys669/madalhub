import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

const PrivacyPolicyScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <View style={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Last updated: October 3, 2025</Text>
        <Text style={styles.paragraph}>
          Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our application.
        </Text>
        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
        </Text>
        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to operate, maintain, and provide you with the features and functionality of the app, as well as to communicate directly with you.
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

export default PrivacyPolicyScreen;