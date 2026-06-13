import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

const EmptyState = ({ title, message }) => (
  <View style={styles.container}>
    <Feather name="inbox" size={48} color="#ccc" />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { height: 150, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 16 },
  message: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8 },
});

export default EmptyState;