import React from 'react';
import { Pressable, ScrollView, Text, View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

export default function WysiwygSponsors({ sponsors, onPressAddSponsor, onEditSponsor, onRemoveSponsor }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
        <Text style={[eventStyles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Sponsors</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 4, gap: 16 }}
      >
        {sponsors.map((s) => (
          <Pressable 
            key={s.id} 
            onPress={() => onEditSponsor?.(s.id)}
            style={{ width: 94, alignItems: 'center' }}
          >
            <View style={{
              width: 94,
              height: 94,
              borderRadius: 12,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: 8
            }}>
              {s.image?.uri ? (
                <Image source={{ uri: s.image.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              ) : (
                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
              )}
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#1a1a1a', textAlign: 'center' }} numberOfLines={2}>{s.name || 'Sponsor'}</Text>
          </Pressable>
        ))}
        
        <Pressable
          onPress={onPressAddSponsor}
          style={{
            width: 94,
            height: 94,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: '#FDBA74',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add-outline" size={32} color="#EA580C" />
        </Pressable>
      </ScrollView>
    </View>
  );
}
