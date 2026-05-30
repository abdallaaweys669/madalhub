import React from 'react';
import { Pressable, ScrollView, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import {
  SPONSOR_TILE_GAP,
  SPONSOR_TILE_HEIGHT,
  SPONSOR_TILE_WIDTH,
} from '@/constants/sponsorTiles';

export default function WysiwygSponsors({ sponsors, onPressAddSponsor, onEditSponsor }) {
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
          marginBottom: 14,
        }}
      >
        <Text style={[eventStyles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Sponsors</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 8,
          paddingRight: 4,
          alignItems: 'flex-start',
        }}
      >
        {sponsors.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => onEditSponsor?.(s.id)}
            style={{
              width: SPONSOR_TILE_WIDTH,
              marginRight: SPONSOR_TILE_GAP,
              alignItems: 'center',
            }}
          >
            <View style={[eventStyles.sponsorLogoTile, { marginBottom: 10 }]}>
              {s.image?.uri ? (
                <Image
                  source={{ uri: s.image.uri }}
                  style={eventStyles.sponsorLogo}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="image-outline" size={34} color="#9CA3AF" />
              )}
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#111827',
                textAlign: 'center',
                lineHeight: 18,
              }}
              numberOfLines={2}
            >
              {s.name || 'Sponsor'}
            </Text>
          </Pressable>
        ))}

        <Pressable
          onPress={onPressAddSponsor}
          style={{
            width: SPONSOR_TILE_WIDTH,
            height: SPONSOR_TILE_HEIGHT,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: '#FDBA74',
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFBF5',
          }}
        >
          <Ionicons name="add-outline" size={34} color="#EA580C" />
        </Pressable>
      </ScrollView>
    </View>
  );
}
