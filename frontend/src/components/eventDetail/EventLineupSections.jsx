import React, { useMemo } from 'react';
import { View } from 'react-native';

import FeaturedSpeakersCarousel from '@/components/eventDetail/FeaturedSpeakersCarousel';
import {
  filterRosterByFormat,
  groupRosterForDisplay,
} from '@/utils/eventRosterByFormat';

function normalizeRole(role) {
  return String(role || 'speaker').trim().toLowerCase();
}

export default function EventLineupSections({
  roster,
  eventFormat,
  onSpeakerPress,
  autoScroll = true,
  ListFooterComponent = null,
  showTitle = true,
}) {
  const groups = useMemo(
    () => groupRosterForDisplay(roster, eventFormat),
    [roster, eventFormat],
  );

  const flatRoster = useMemo(
    () => filterRosterByFormat(roster, eventFormat),
    [roster, eventFormat],
  );

  if (!groups.length && !ListFooterComponent) return null;

  const handlePress = onSpeakerPress
    ? (person) => {
        const index = flatRoster.findIndex(
          (row) =>
            (person.id != null && row.id === person.id) ||
            (row.displayName === person.displayName &&
              normalizeRole(row.role) === normalizeRole(person.role)),
        );
        onSpeakerPress(person, index >= 0 ? index : 0);
      }
    : undefined;

  if (!groups.length) {
    return (
      <FeaturedSpeakersCarousel
        roster={[]}
        showTitle={showTitle}
        sectionTitle="Speakers"
        ListFooterComponent={ListFooterComponent}
      />
    );
  }

  return (
    <View>
      {groups.map((group, groupIndex) => (
        <FeaturedSpeakersCarousel
          key={`${group.title}-${groupIndex}`}
          roster={group.roster}
          showTitle={showTitle}
          sectionTitle={group.title}
          showRole={Boolean(group.showRole)}
          autoScroll={autoScroll}
          onSpeakerPress={handlePress}
          ListFooterComponent={groupIndex === groups.length - 1 ? ListFooterComponent : null}
        />
      ))}
    </View>
  );
}
