import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getLineupCarouselMetrics } from '@/components/eventDetail/lineupCarouselLayout';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

function SponsorCard({ sponsor, metrics, onPress }) {
  const name = sponsor.name?.trim() || 'Sponsor';
  const radius = Math.round(metrics.avatarSize * 0.2);

  return (
    <Pressable onPress={onPress} style={[styles.card, { width: metrics.cardWidth }]}>
      <View
        style={[
          styles.logoRing,
          { width: metrics.avatarSize + 6, height: metrics.avatarSize + 6 },
        ]}
      >
        {sponsor.image?.uri ? (
          <Image
            source={{ uri: sponsor.image.uri }}
            style={{ width: metrics.avatarSize, height: metrics.avatarSize, borderRadius: radius }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{
              width: metrics.avatarSize,
              height: metrics.avatarSize,
              borderRadius: radius,
              backgroundColor: '#F8FAFC',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="image" size={Math.round(metrics.avatarSize * 0.28)} color="#94A3B8" />
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
}

export default function WysiwygSponsors({ sponsors, onPressAddSponsor, onEditSponsor }) {
  const { width: windowWidth } = useWindowDimensions();
  const metrics = useMemo(() => getLineupCarouselMetrics(windowWidth), [windowWidth]);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[eventStyles.sectionTitle, styles.sectionTitle]}>Sponsors</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={metrics.itemStride}
      >
        {sponsors.map((s) => (
          <View key={s.id} style={{ marginRight: metrics.cardGap }}>
            <SponsorCard sponsor={s} metrics={metrics} onPress={() => onEditSponsor?.(s.id)} />
          </View>
        ))}

        <Pressable
          onPress={onPressAddSponsor}
          style={[styles.addCard, { width: metrics.cardWidth }]}
        >
          <View
            style={[
              styles.addLogoRing,
              { width: metrics.avatarSize + 6, height: metrics.avatarSize + 6 },
            ]}
          >
            <View
              style={{
                width: metrics.avatarSize,
                height: metrics.avatarSize,
                borderRadius: Math.round(metrics.avatarSize * 0.2),
                backgroundColor: '#FFF7ED',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="plus" size={22} color="#EA580C" />
            </View>
          </View>
          <Text style={styles.addLabel} numberOfLines={2}>
            Add sponsor
          </Text>
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
    paddingRight: 6,
    paddingBottom: 4,
  },
  card: {
    alignItems: 'center',
  },
  logoRing: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  name: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 14,
    textAlign: 'center',
  },
  addCard: {
    alignItems: 'center',
  },
  addLogoRing: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FDBA74',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBF5',
  },
  addLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
    textAlign: 'center',
    lineHeight: 14,
  },
});
