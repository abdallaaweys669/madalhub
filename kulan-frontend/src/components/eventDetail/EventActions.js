import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

function AttendeePreviewImage({ att, index }) {
  if (att?.isAnonymous) {
    return (
      <View
        style={[
          styles.attendeeImage,
          styles.attendeeAnonymous,
          { marginLeft: index > 0 ? -10 : 0 },
        ]}
      >
        <Feather name="eye-off" size={14} color="#9CA3AF" />
      </View>
    );
  }

  if (att?.avatarUrl) {
    return (
      <Image
        source={{ uri: att.avatarUrl }}
        style={[styles.attendeeImage, { marginLeft: index > 0 ? -10 : 0 }]}
      />
    );
  }

  return (
    <View
      style={[styles.attendeeImage, styles.attendeeFallback, { marginLeft: index > 0 ? -10 : 0 }]}
    >
      <Feather name="user" size={15} color="#FFFFFF" />
    </View>
  );
}

const EventActions = ({ attendees = [], goingCount = 0, onViewAttendees }) => {
  const previews = Array.isArray(attendees) ? attendees.slice(0, 3) : [];
  const displayGoing = Number.isFinite(Number(goingCount)) ? Number(goingCount) : previews.length;

  return (
    <View style={styles.actionsSection}>
      <Text style={styles.sectionTitle}>Who&apos;s going</Text>
      <TouchableOpacity
        style={styles.attendeesContainer}
        activeOpacity={0.85}
        onPress={onViewAttendees}
      >
        <View style={styles.attendeeImages}>
          {previews.length > 0
            ? previews.map((att, index) => (
                <AttendeePreviewImage
                  key={att?.userId != null ? String(att.userId) : `attendee-${index}`}
                  att={att}
                  index={index}
                />
              ))
            : null}
        </View>
        <Text style={styles.attendeesText}>{`${displayGoing} going`}</Text>
        <Feather name="chevron-right" size={22} color="#7D8796" style={styles.attendeesArrow} />
      </TouchableOpacity>
    </View>
  );
};

export default EventActions;