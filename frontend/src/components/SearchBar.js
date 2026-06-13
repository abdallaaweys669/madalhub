import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Make it accept props for the query and for handling changes
const SearchBar = ({ query, onQueryChange }) => {
  return (
    <View style={styles.container}>
      <Feather name="search" size={20} color="#888" style={styles.icon} />
      <TextInput
        placeholder="Search events by title..."
        style={styles.input}
        value={query} // Display the current search query
        onChangeText={onQueryChange} // Call the function to update the query
      />
    </View>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 16, marginHorizontal: 20, marginVertical: 10, height: 50 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
});

export default SearchBar;