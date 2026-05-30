import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';
import { Feather } from '@expo/vector-icons';

const EventInfo = ({
  description,
  datePrimary,
  dateSecondary,
  locationPrimary,
  locationSecondary,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.infoBlock}>
      {description ? (
        <View style={styles.descriptionWrap}>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 4}>
            {description}
          </Text>
          <TouchableOpacity onPress={() => setExpanded((prev) => !prev)}>
            <Text style={styles.readMore}>{expanded ? 'See less' : 'See more'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.infoSpacing} />
      <View style={styles.infoRow}>
        <View style={styles.infoIconBg}>
          <Feather name="calendar" size={18} color="#FF7A00" />
        </View>
        <View>
          <Text style={styles.infoText}>{datePrimary}</Text>
          <Text style={styles.infoSubText}>{dateSecondary}</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoIconBg}>
          <Feather name="map-pin" size={18} color="#FF7A00" />
        </View>
        <View>
          <Text style={styles.infoText}>{locationPrimary}</Text>
          {locationSecondary ? (
            <Text style={styles.infoSubText}>{locationSecondary}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default EventInfo;
