import React from 'react';
import { View, ImageBackground, TouchableOpacity } from 'react-native';
import { Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../../constants/eventDetails_styles/eventDetails.styles';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';

const EventHeader = ({ event, onBack, onSave, isSaved }) => {
  const insets = useSafeAreaInsets();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${event.title}\n${event.details ?? ''}`,
      });
    } catch {
      // User can dismiss share sheet.
    }
  };

  return (
    <View style={styles.headerWrapper}>
      {event.coverImageUrl ? (
        <ImageBackground source={{ uri: event.coverImageUrl }} style={styles.headerImage} resizeMode="cover">
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            locations={[0.45, 1]}
            style={styles.headerGradient}
          />
        </ImageBackground>
      ) : (
        <View style={styles.headerImage}>
          <CoverPlaceholder
            letter={event.coverLetter ?? event.title}
            gradient={event.coverGradient ?? DEFAULT_COVER_GRADIENT}
            borderRadius={0}
            style={{ flex: 1 }}
            letterSize={56}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            locations={[0.45, 1]}
            style={styles.headerGradient}
          />
        </View>
      )}

      <View style={[styles.headerActionsRow, { top: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.rightHeaderActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <Feather name="share-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onSave}>
            <Feather name="bookmark" size={18} color={isSaved ? '#FF7A00' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default EventHeader;