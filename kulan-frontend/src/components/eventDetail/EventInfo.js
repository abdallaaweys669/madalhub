import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';
import { Feather } from '@expo/vector-icons';
import EventMetaChipsRow from '@/components/event/EventMetaChipsRow';

const EventInfo = ({
  title,
  description,
  datePrimary,
  dateSecondary,
  locationPrimary,
  locationSecondary,
  categoryName,
  eventFormat,
  isOnline: isOnlineProp,
}) => {
  const isOnline =
    typeof isOnlineProp === 'boolean'
      ? isOnlineProp
      : locationPrimary?.toLowerCase() === 'online';
  const categoryTrimmed =
    typeof categoryName === 'string' ? categoryName.trim() : '';
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.infoBlock}>
      <EventMetaChipsRow
        variant="detail"
        categoryLabel={categoryTrimmed || undefined}
        formatKey={eventFormat}
        isOnline={isOnline}
        style={{ marginTop: 12, marginBottom: 10 }}
      />
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
          {locationSecondary ? (
            <Text style={styles.infoSubText}>{locationSecondary}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default EventInfo;