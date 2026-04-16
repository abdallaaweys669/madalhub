import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

const ExpandableText = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <View>
      <View style={{ height: isExpanded ? 'auto' : 100, overflow: 'hidden' }}>
        <Text style={styles.description}>{text}</Text>
        {!isExpanded && (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.0)', 'rgba(255, 255, 255, 1.0)']}
            locations={[0.5, 1.0]}
            style={styles.fadeEffect}
            pointerEvents="none"
          />
        )}
      </View>
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.readMore}>
          {isExpanded ? 'Read less' : 'Read more'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const EventAbout = ({ description }) => {
  return (
    <>
      <Text style={styles.sectionTitle}>About The Event</Text>
      <ExpandableText text={description} />
    </>
  );
};

export default EventAbout;