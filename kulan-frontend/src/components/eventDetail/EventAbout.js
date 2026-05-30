import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

const ExpandableText = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const bullets = [
    'Live performances by 5 celebrated poets',
    'Traditional tea and snacks served',
    'Networking and Q&A session',
  ];

  return (
    <View>
      <View style={{ maxHeight: isExpanded ? 500 : 86, overflow: 'hidden' }}>
        <Text style={styles.description}>{text}</Text>
      </View>
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.readMore}>
          {isExpanded ? 'Read less' : 'Read full description'}
        </Text>
      </TouchableOpacity>
      <View style={{ marginTop: 10 }}>
        {bullets.map((bullet) => (
          <Text key={bullet} style={styles.bulletPoint}>
            {'\u2022'} {bullet}
          </Text>
        ))}
      </View>
    </View>
  );
};

const EventAbout = ({ description }) => {
  return (
    <View style={styles.infoCard}>
      <ExpandableText text={description} />
    </View>
  );
};

export default EventAbout;