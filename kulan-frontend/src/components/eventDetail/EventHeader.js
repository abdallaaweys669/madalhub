import React from 'react';
import { View, Image, TouchableOpacity, Share } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
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
      // User dismissed share sheet.
    }
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={[styles.headerToolbar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconButtonMeetup}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.rightHeaderActions}>
          <TouchableOpacity
            style={styles.iconButtonMeetup}
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Share event"
          >
            <Feather name="share-2" size={18} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButtonMeetup}
            onPress={onSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove bookmark' : 'Save event'}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? '#FF7B3F' : '#0F172A'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.headerBannerFrame}>
        {event.coverImageUrl ? (
          <Image source={{ uri: event.coverImageUrl }} style={styles.headerBannerImage} resizeMode="cover" />
        ) : (
          <CoverPlaceholder
            letter={event.coverLetter ?? event.title}
            gradient={event.coverGradient ?? DEFAULT_COVER_GRADIENT}
            borderRadius={0}
            style={styles.headerBannerImage}
            letterSize={56}
          />
        )}
      </View>
    </View>
  );
};

export default EventHeader;
