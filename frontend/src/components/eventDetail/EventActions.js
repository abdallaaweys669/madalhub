import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { EventCapacityBar } from '@/components/event/EventCapacityBar';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

const EventActions = ({
  attendees = [],
  goingCount = 0,
  capacity = null,
  eventState,
  onViewAttendees,
}) => {
  const previews = Array.isArray(attendees) ? attendees.slice(0, 3) : [];
  const displayGoing = Number.isFinite(Number(goingCount)) ? Number(goingCount) : previews.length;
  const showCapacity = typeof capacity === 'number' && capacity > 0;

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
                <MemberInitialAvatar
                  key={att?.userId != null ? String(att.userId) : `attendee-${index}`}
                  name={att?.isAnonymous ? 'Guest' : att?.name || 'Member'}
                  size={36}
                  style={index > 0 ? styles.attendeeAvatarOverlap : null}
                />
              ))
            : null}
        </View>
        <Text style={styles.attendeesText}>{`${displayGoing} going`}</Text>
        <Feather name="chevron-right" size={22} color="#7D8796" style={styles.attendeesArrow} />
      </TouchableOpacity>
      {showCapacity ? (
        <EventCapacityBar
          goingCount={displayGoing}
          capacity={capacity}
          eventState={eventState}
          style={styles.capacityBarInDetail}
        />
      ) : null}
    </View>
  );
};

export default EventActions;
