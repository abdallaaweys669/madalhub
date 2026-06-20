import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import FeaturedSpeakersCarousel from '@/components/eventDetail/FeaturedSpeakersCarousel';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

export default function WysiwygRoster({ roster, template, onPressAdd, onPressPerson }) {
  const addCard = (
    <Pressable onPress={onPressAdd} style={styles.addCard} accessibilityRole="button" accessibilityLabel="Add speaker">
      <View style={styles.addIconWrap}>
        <Feather name="plus" size={28} color="#EA580C" />
      </View>
      <Text style={styles.addLabel}>Add speaker</Text>
    </Pressable>
  );

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[eventStyles.sectionTitle, styles.sectionTitle]}>Featured Speakers</Text>
      </View>
      <Text style={styles.helper}>
        Add speakers, panelists, moderators, or hosts — same cards attendees see on the event page.
      </Text>
      {template === 'panel' ? (
        <Text style={styles.helper}>Panels work best with at least two panelists and one moderator.</Text>
      ) : null}

      <FeaturedSpeakersCarousel
        roster={roster}
        showTitle={false}
        onSpeakerPress={(person) => onPressPerson?.(person)}
        ListFooterComponent={addCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 0,
  },
  helper: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  addCard: {
    width: 124,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FDBA74',
    backgroundColor: '#FFFBF5',
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 12,
  },
  addIconWrap: {
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  addLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
