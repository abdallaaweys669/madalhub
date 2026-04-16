import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

const EventInfo = ({ title, date, location }) => {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconBg}><Feather name="calendar" size={20} color="#333" /></View>
          <Text style={styles.infoText}>{date}</Text>
        </View>
        <View style={[styles.infoRow, { marginBottom: 0 }]}>
          <View style={styles.infoIconBg}><Feather name="map-pin" size={20} color="#333" /></View>
          <Text style={styles.infoText}>{location}</Text>
        </View>
      </View>
    </>
  );
};

export default EventInfo;