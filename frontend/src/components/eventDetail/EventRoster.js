import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image } from 'react-native';
import { formatKeyToDisplayLabel } from '@/constants/eventFormatLabels';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

function RosterPhoto({ person }) {
  const uri = resolveApiAssetUrl(person.photoUrl);
  if (uri) {
    return <Image source={{ uri }} style={styles.photo} resizeMode="cover" accessibilityLabel={person.displayName} />;
  }
  return <MemberInitialAvatar name={person.displayName || 'Guest'} size={64} borderWidth={0} />;
}

const EventRoster = ({ roster, onPersonPress, ListFooterComponent }) => {
  if (!roster || roster.length === 0) {
    return ListFooterComponent ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
        {ListFooterComponent}
      </ScrollView>
    ) : null;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {roster.map((person, index) => {
        const roleLabel = formatKeyToDisplayLabel(person.role) || person.role || 'Guest';
        const card = (
          <View style={styles.card}>
            <View style={styles.photoFrame}>
              <RosterPhoto person={person} />
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {person.displayName}
            </Text>
            <Text style={styles.role} numberOfLines={1}>
              {roleLabel}
            </Text>
            {person.title ? (
              <Text style={styles.title} numberOfLines={2}>
                {person.title}
              </Text>
            ) : null}
          </View>
        );

        if (!onPersonPress) {
          return <View key={person.id || `${person.displayName}-${index}`}>{card}</View>;
        }
        return (
          <Pressable
            key={person.id || `${person.displayName}-${index}`}
            onPress={() => onPersonPress(person, index)}
            style={({ pressed }) => [pressed ? styles.cardPressed : null]}
          >
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
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    width: 116,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  photoFrame: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  name: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 18,
  },
  role: {
    marginTop: 4,
    fontSize: 11,
    color: '#FF7B3F',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 4,
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 15,
  },
});

export default EventRoster;
