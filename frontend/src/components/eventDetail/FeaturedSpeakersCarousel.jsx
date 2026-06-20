import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { styles as detailStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

const CARD_WIDTH = 124;
const IMAGE_HEIGHT = 124;
const CARD_GAP = 12;

function SpeakerPhoto({ person }) {
  const uri = resolveApiAssetUrl(person.photoUrl);
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.photo}
        resizeMode="cover"
        accessibilityLabel={person.displayName}
      />
    );
  }

  return (
    <View style={styles.photoFallback}>
      <MemberInitialAvatar name={person.displayName || 'Speaker'} size={52} borderWidth={0} />
    </View>
  );
}

function SpeakerCard({ person, onPress }) {
  const subtitle =
    typeof person.title === 'string' && person.title.trim() ? person.title.trim() : '';

  const card = (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <SpeakerPhoto person={person} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.name} numberOfLines={2}>
          {person.displayName}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return card;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View photo of ${person.displayName}`}
      style={({ pressed }) => [pressed ? styles.cardPressed : null]}
    >
      {card}
    </Pressable>
  );
}

const FeaturedSpeakersCarousel = ({ roster, onSpeakerPress, showTitle = true, ListFooterComponent = null }) => {
  if (!roster?.length && !ListFooterComponent) return null;

  const cards = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      decelerationRate="fast"
    >
      {roster.map((person, index) => (
        <SpeakerCard
          key={person.id ?? `${person.displayName}-${index}`}
          person={person}
          onPress={onSpeakerPress ? () => onSpeakerPress(person, index) : undefined}
        />
      ))}
      {ListFooterComponent}
    </ScrollView>
  );

  if (!showTitle) return <View style={styles.section}>{cards}</View>;

  return (
    <View style={styles.section}>
      <Text style={detailStyles.sectionTitle}>Featured Speakers</Text>
      {cards}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  scrollContent: {
    gap: CARD_GAP,
    paddingRight: 4,
    paddingBottom: 4,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  imageWrap: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#FFF7ED',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  textBlock: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 17,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
});

export default FeaturedSpeakersCarousel;
