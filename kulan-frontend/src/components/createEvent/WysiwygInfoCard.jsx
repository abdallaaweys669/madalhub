import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

const FORMAT_LABELS = {
  meetup: 'Meetup',
  panel: 'Panel',
  seminar: 'Seminar',
  workshop: 'Workshop',
  talk: 'Talk',
  bootcamp: 'Bootcamp',
};

export default function WysiwygInfoCard({
  title,
  description,
  datePrimary,
  dateSecondary,
  categoryLabel,
  formatLabel,
  deliveryMode,
  onChangeTitle,
  onChangeDescription,
  onPressEditDate,
  onPressCategory,
  onPressFormat,
  onPressDeliveryMode,
}) {
  const [expanded, setExpanded] = useState(false);
  const isOnline = deliveryMode === 'online';

  return (
    <View style={eventStyles.infoBlock}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Pressable
          onPress={onPressCategory}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Feather name="tag" size={12} color="#EA580C" />
          <Text style={{ color: '#EA580C', fontWeight: '700', fontSize: 12 }}>{categoryLabel || 'Pick category'}</Text>
        </Pressable>

        <Pressable 
          onPress={onPressDeliveryMode} 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Feather name={isOnline ? 'video' : 'map-pin'} size={12} color="#4338CA" />
          <Text style={{ color: '#4338CA', fontWeight: '700', fontSize: 12 }}>{isOnline ? 'ONLINE' : 'IN-PERSON'}</Text>
        </Pressable>

        <Pressable
          onPress={onPressFormat}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Feather name="grid" size={12} color="#059669" />
          <Text style={{ color: '#059669', fontWeight: '700', fontSize: 12 }}>{FORMAT_LABELS[formatLabel] || 'Pick format'}</Text>
        </Pressable>
      </View>

      <TextInput
        value={title}
        onChangeText={onChangeTitle}
        placeholder="Tap to add event title"
        placeholderTextColor="#9CA3AF"
        style={[eventStyles.title, { paddingVertical: 0 }]}
      />

      <View style={eventStyles.descriptionWrap}>
        <TextInput
          value={description}
          onChangeText={onChangeDescription}
          multiline
          placeholder="Tap to add a description attendees will read."
          placeholderTextColor="#9CA3AF"
          style={[eventStyles.description, { minHeight: expanded ? 100 : 70 }]}
        />
      </View>
      <Pressable onPress={() => setExpanded((prev) => !prev)}>
        <Text style={eventStyles.readMore}>{expanded ? 'See less' : 'See more'}</Text>
      </Pressable>

      <View style={eventStyles.infoSpacing} />
      <Pressable onPress={onPressEditDate} style={eventStyles.infoRow}>
        <View style={eventStyles.infoIconBg}>
          <Feather name="calendar" size={18} color="#FF7A00" />
        </View>
        <View>
          <Text style={eventStyles.infoText}>{datePrimary}</Text>
          <Text style={eventStyles.infoSubText}>{dateSecondary}</Text>
        </View>
      </Pressable>
    </View>
  );
}
