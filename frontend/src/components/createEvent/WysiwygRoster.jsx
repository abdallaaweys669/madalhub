import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import EventLineupSections from '@/components/eventDetail/EventLineupSections';
import { getLineupCarouselMetrics } from '@/components/eventDetail/lineupCarouselLayout';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { getRosterSectionMeta } from '@/utils/eventRosterByFormat';

export default function WysiwygRoster({ roster, eventFormat, onPressAdd, onPressPerson }) {
  const { width: windowWidth } = useWindowDimensions();
  const metrics = useMemo(() => getLineupCarouselMetrics(windowWidth), [windowWidth]);
  const sectionMeta = useMemo(() => getRosterSectionMeta(eventFormat), [eventFormat]);
  const showSubsectionTitles = eventFormat === 'panel';

  const addCard = (
    <Pressable
      onPress={onPressAdd}
      style={[styles.addCard, { width: metrics.cardWidth }]}
      accessibilityRole="button"
      accessibilityLabel={sectionMeta.addLabel}
    >
      <View
        style={[
          styles.addAvatarRing,
          { width: metrics.avatarSize + 6, height: metrics.avatarSize + 6 },
        ]}
      >
        <View
          style={[
            styles.addAvatarInner,
            { width: metrics.avatarSize, height: metrics.avatarSize, borderRadius: metrics.avatarSize / 2 },
          ]}
        >
          <Feather name="plus" size={22} color="#EA580C" />
        </View>
      </View>
      <Text style={styles.addLabel} numberOfLines={2}>
        {sectionMeta.addLabel}
      </Text>
    </Pressable>
  );

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[eventStyles.sectionTitle, styles.sectionTitle]}>{sectionMeta.title}</Text>
      </View>
      <Text style={styles.helper}>{sectionMeta.helper}</Text>

      <EventLineupSections
        roster={roster}
        eventFormat={eventFormat}
        showTitle={showSubsectionTitles}
        autoScroll={false}
        onSpeakerPress={(person) => onPressPerson?.(person)}
        ListFooterComponent={addCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 0,
  },
  helper: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  addCard: {
    alignItems: 'center',
  },
  addAvatarRing: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FDBA74',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBF5',
  },
  addAvatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  addLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
    textAlign: 'center',
    lineHeight: 14,
  },
});
