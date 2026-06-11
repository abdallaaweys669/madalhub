import React from 'react';
import { Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { trackEventInteraction } from '@/api/trackEventInteraction';
import { EVENT_FEED_BRAND_ORANGE } from '@/components/event/feed/eventFeedTokens';

export type EventFeedCoverActionStyle = 'glass' | 'light';
export type EventFeedCoverActionSize = 'compact' | 'comfortable';

type EventFeedCoverActionsProps = {
  eventId: string | number;
  shareMessage: string;
  actionStyle?: EventFeedCoverActionStyle;
  size?: EventFeedCoverActionSize;
};

export function EventFeedCoverActions({
  eventId,
  shareMessage,
  actionStyle = 'light',
  size = 'compact',
}: EventFeedCoverActionsProps) {
  const router = useGuardedRouter();
  const { isLoggedIn } = useAuth();
  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();
  const isSaved = savedEventIds.includes(String(eventId));
  const isGlass = actionStyle === 'glass';
  const isComfortable = size === 'comfortable';
  const btnSize = isComfortable ? 40 : 34;
  const shareIconSize = isComfortable ? 19 : 14;
  const heartIconSize = isComfortable ? 20 : 15;

  const toggleSave = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }
    if (isSaved) unsaveEvent(eventId);
    else saveEvent(eventId);
  };

  const shareEvent = async () => {
    if (isLoggedIn) trackEventInteraction(eventId, 'shared');
    try {
      await Share.share({ message: shareMessage });
    } catch {
      /* user dismissed share sheet */
    }
  };

  return (
    <View style={[styles.coverHeroActions, isComfortable && styles.coverHeroActionsComfortable]}>
      <TouchableOpacity
        style={[
          styles.coverHeroActionBtn,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
          isGlass ? styles.btnGlass : styles.btnLight,
        ]}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => void shareEvent()}
        accessibilityRole="button"
        accessibilityLabel="Share event"
      >
        <Feather
          name="share-2"
          size={shareIconSize}
          color={isGlass ? '#FFFFFF' : EVENT_FEED_BRAND_ORANGE}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.coverHeroActionBtn,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
          isGlass
            ? isSaved
              ? styles.btnGlassSaved
              : styles.btnGlass
            : isSaved
              ? styles.btnLightSaved
              : styles.btnLight,
        ]}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={toggleSave}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Remove from saved' : 'Save event'}
      >
        <Ionicons
          name={isSaved ? 'heart' : 'heart-outline'}
          size={heartIconSize}
          color={isGlass || isSaved ? '#FFFFFF' : EVENT_FEED_BRAND_ORANGE}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  coverHeroActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  coverHeroActionsComfortable: {
    top: 12,
    right: 12,
    gap: 10,
  },
  coverHeroActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGlass: {
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  btnGlassSaved: {
    backgroundColor: EVENT_FEED_BRAND_ORANGE,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  btnLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 63, 0.35)',
  },
  btnLightSaved: {
    backgroundColor: EVENT_FEED_BRAND_ORANGE,
    borderColor: EVENT_FEED_BRAND_ORANGE,
  },
});
