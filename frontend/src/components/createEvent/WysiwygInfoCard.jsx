import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import EventMetaChipsRow from '@/components/event/EventMetaChipsRow';
import { Feather } from '@expo/vector-icons';

const EXPANDED_DESCRIPTION_MIN_HEIGHT = 140;

function descriptionNeedsToggle(description) {
  const text = String(description ?? '');
  if (!text.trim()) return false;
  if (text.length > 120) return true;
  return text.split('\n').length > 4;
}

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
  scheduleWarning,
  scheduleUnset = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [descriptionHeight, setDescriptionHeight] = useState(EXPANDED_DESCRIPTION_MIN_HEIGHT);
  const isOnline = deliveryMode === 'online';
  const showToggle = useMemo(() => descriptionNeedsToggle(description), [description]);

  const expandDescription = () => {
    const lineCount = String(description).split('\n').length;
    const estimatedHeight = Math.max(EXPANDED_DESCRIPTION_MIN_HEIGHT, lineCount * 20 + 8);
    setDescriptionHeight(estimatedHeight);
    setExpanded(true);
  };

  const handleDescriptionSizeChange = (event) => {
    if (!expanded || !showToggle) return;
    const nextHeight = Math.max(
      EXPANDED_DESCRIPTION_MIN_HEIGHT,
      Math.ceil(event.nativeEvent.contentSize.height),
    );
    setDescriptionHeight(nextHeight);
  };

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

      {!expanded && showToggle ? (
        <Pressable
          onPress={expandDescription}
          accessibilityRole="button"
          accessibilityLabel="Expand description"
          style={eventStyles.descriptionWrap}
        >
          <Text style={eventStyles.description} numberOfLines={4}>
            {description}
          </Text>
        </Pressable>
      ) : (
        <View style={eventStyles.descriptionWrap}>
          <TextInput
            value={description}
            onChangeText={onChangeDescription}
            multiline
            scrollEnabled={false}
            onContentSizeChange={handleDescriptionSizeChange}
            placeholder="Tap to add a description attendees will read."
            placeholderTextColor="#9CA3AF"
            style={[
              eventStyles.description,
              showToggle && expanded
                ? {
                    height: descriptionHeight,
                    minHeight: EXPANDED_DESCRIPTION_MIN_HEIGHT,
                    paddingVertical: 0,
                  }
                : {
                    minHeight: 70,
                    paddingVertical: 0,
                  },
            ]}
          />
        </View>
      )}
      {showToggle ? (
        <Pressable
          onPress={() => {
            if (expanded) {
              setExpanded(false);
              return;
            }
            expandDescription();
          }}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'See less description' : 'See more description'}
        >
          <Text style={eventStyles.readMore}>{expanded ? 'See less' : 'See more'}</Text>
        </Pressable>
      ) : null}

      <View style={eventStyles.infoSpacing} />
      <Pressable onPress={onPressEditDate} style={eventStyles.infoRow}>
        <View style={eventStyles.infoIconBg}>
          <Feather name="calendar" size={18} color="#FF7A00" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[eventStyles.infoText, scheduleUnset && { color: '#9CA3AF' }]}>
            {datePrimary}
          </Text>
          <Text style={eventStyles.infoSubText}>{dateSecondary}</Text>
          {scheduleWarning ? (
            <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, lineHeight: 16 }}>
              {scheduleWarning}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
