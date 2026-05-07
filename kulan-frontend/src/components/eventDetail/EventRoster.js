import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable } from 'react-native';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

const EventRoster = ({ roster, onPersonPress, ListFooterComponent }) => {
  if (!roster || roster.length === 0) return ListFooterComponent ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {ListFooterComponent}
    </ScrollView>
  ) : null;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.container}
    >
      {roster.map((person) => {
        const avatarUrl = resolveApiAssetUrl(person.photoUrl);
        const initials = person.displayName 
          ? person.displayName.substring(0, 2).toUpperCase() 
          : '??';

        const card = (
          <View style={styles.card}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
            <Text style={styles.name}>{person.displayName}</Text>
            <Text style={styles.role} numberOfLines={1}>{person.role}</Text>
            {person.title ? (
              <Text style={styles.title}>{person.title}</Text>
            ) : null}
          </View>
        );

        if (!onPersonPress) return <View key={person.id || person.displayName}>{card}</View>;
        return (
          <Pressable key={person.id || person.displayName} onPress={() => onPersonPress(person)}>
            {card}
          </Pressable>
        );
      })}
      {ListFooterComponent}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    gap: 16,
    paddingBottom: 4,
  },
  card: {
    width: 86,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEFE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  initials: {
    color: '#FF7B3F',
    fontSize: 20,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 19,
  },
  role: {
    fontSize: 11,
    color: '#FF7B3F',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 17,
  }
});

export default EventRoster;