import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

export default function WysiwygLocation({ locationPrimary, locationSecondary, onPress }) {
  return (
    <Pressable onPress={onPress} style={eventStyles.infoRow}>
      <View style={eventStyles.infoIconBg}>
        <Feather name="map-pin" size={18} color="#FF7A00" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={eventStyles.infoText}>{locationPrimary || 'Tap to set venue or online link'}</Text>
        <Text style={eventStyles.infoSubText}>{locationSecondary || 'Select map location or paste meeting URL'}</Text>
      </View>
    </Pressable>
  );
}
