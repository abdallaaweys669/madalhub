import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

const EventActions = ({ attendees }) => {
  return (
    <>
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Join Event</Text>
      </TouchableOpacity>

      <View style={styles.attendeesContainer}>
        <View style={styles.attendeeImages}>
          {attendees.map((att, index) => (
            <Image
              key={index}
              source={att}
              style={[
                styles.attendeeImage,
                { marginLeft: index > 0 ? -15 : 0 },
              ]}
            />
          ))}
        </View>

        <Text style={styles.attendeesText}>25 People Joined</Text>
      </View>

      <View style={styles.divider} />
    </>
  );
};

export default EventActions;