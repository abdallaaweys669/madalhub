import React from 'react';
import { View, ImageBackground, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';

const EventHeader = ({ event, onBack, onSave, isSaved }) => {
  return (
    <ImageBackground source={event.image} style={styles.headerImage}>
      <View style={styles.headerOverlay}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onSave}>
          <Feather name="bookmark" size={24} color={isSaved ? '#00FFAB' : '#fff'} />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default EventHeader;