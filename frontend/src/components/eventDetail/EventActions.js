import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

      <View style={localStyles.card}>
        <TouchableOpacity
          style={localStyles.attendeesRow}
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
          <Feather name="chevron-right" size={22} color="#FF7B3F" style={styles.attendeesArrow} />
        </TouchableOpacity>

        {showCapacity ? (
          <>
            <View style={localStyles.divider} />
            <EventCapacityBar
              goingCount={displayGoing}
              capacity={capacity}
              eventState={eventState}
              variant="detail"
            />
          </>
        ) : null}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
});

export default EventActions;
