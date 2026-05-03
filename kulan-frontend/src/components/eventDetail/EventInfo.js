import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';
import { Feather } from '@expo/vector-icons';

const EventInfo = ({
  title,
  description,
  datePrimary,
  dateSecondary,
  locationPrimary,
  locationSecondary,
}) => {
  const isOnline = locationPrimary?.toLowerCase() === 'online';
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.infoBlock}>
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{isOnline ? 'ONLINE' : 'IN-PERSON'}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.descriptionWrap}>
        <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>
          {description}
        </Text>
      </View>
      <TouchableOpacity onPress={() => setExpanded((prev) => !prev)}>
        <Text style={styles.readMore}>{expanded ? 'See less' : 'See more'}</Text>
      </TouchableOpacity>
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
          <Text style={styles.infoSubText}>{locationSecondary}</Text>
        </View>
      </View>
    </View>
  );
};

export default EventInfo;