import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import EventMetaChipsRow from '@/components/event/EventMetaChipsRow';

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
      <EventMetaChipsRow
        variant="create"
        categoryLabel={categoryLabel}
        formatKey={formatLabel}
        isOnline={isOnline}
        onPressCategory={onPressCategory}
        onPressDelivery={onPressDeliveryMode}
        onPressFormat={onPressFormat}
        style={{ marginBottom: 12 }}
      />

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
