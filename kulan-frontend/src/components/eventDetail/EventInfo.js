import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

import { EventDateLocationRows } from '@/components/event/EventDateLocationRows';

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
      <EventDateLocationRows
        datePrimary={datePrimary}
        dateSecondary={dateSecondary}
        locationPrimary={locationPrimary}
        locationSecondary={locationSecondary}
      />
    </View>
  );
};

export default EventInfo;
