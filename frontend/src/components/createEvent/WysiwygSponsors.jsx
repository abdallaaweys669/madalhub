import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

const CARD_WIDTH = 124;
const LOGO_HEIGHT = 88;

function SponsorCard({ sponsor, onPress }) {
  const name = sponsor.name?.trim() || 'Sponsor';

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.logoWrap}>
        {sponsor.image?.uri ? (
          <Image source={{ uri: sponsor.image.uri }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Feather name="image" size={28} color="#9CA3AF" />
        )}
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
      </View>
    </Pressable>
  );
}

export default function WysiwygSponsors({ sponsors, onPressAddSponsor, onEditSponsor }) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[eventStyles.sectionTitle, styles.sectionTitle]}>Sponsors</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {sponsors.map((s) => (
          <SponsorCard key={s.id} sponsor={s} onPress={() => onEditSponsor?.(s.id)} />
        ))}

        <Pressable onPress={onPressAddSponsor} style={styles.addCard}>
          <View style={styles.addLogoWrap}>
            <Feather name="plus" size={28} color="#EA580C" />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.addLabel}>Add sponsor</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 0,
  },
  row: {
    gap: 12,
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
  logoWrap: {
    width: CARD_WIDTH,
    height: LOGO_HEIGHT,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 17,
    textAlign: 'center',
  },
  addCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FDBA74',
    backgroundColor: '#FFFBF5',
    overflow: 'hidden',
  },
  addLogoWrap: {
    width: CARD_WIDTH,
    height: LOGO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  addLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
    textAlign: 'center',
  },
});
