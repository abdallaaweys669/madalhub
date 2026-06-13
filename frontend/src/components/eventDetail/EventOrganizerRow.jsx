import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import useGuardedRouter from '@/hooks/useGuardedRouter';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import VerificationBadgeWhite from '@/assets/verification badge white mode.svg';

const EventOrganizerRow = ({
  organizerId,
  name,
  logoUrl,
  initials,
  verified = false,
}) => {
  const router = useGuardedRouter();

  const displayName = typeof name === 'string' && name.trim() ? name.trim() : 'Organizer';
  const displayInitials = String(initials || displayName).slice(0, 2).toUpperCase();
  const canNavigate = organizerId != null && Number(organizerId) > 0;

  const handlePress = () => {
    if (!canNavigate) return;
    router.push(`/organizer/${organizerId}`);
  };

  return (
    <TouchableOpacity
      style={[styles.eventOrganizerRow, !canNavigate ? styles.eventOrganizerRowDisabled : null]}
      onPress={handlePress}
      disabled={!canNavigate}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`Organized by ${displayName}`}
    >
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.eventOrganizerAvatar} />
      ) : (
        <View style={[styles.eventOrganizerAvatar, styles.eventOrganizerAvatarFallback]}>
          <Text style={styles.eventOrganizerAvatarText}>{displayInitials}</Text>
        </View>
      )}

      <View style={styles.eventOrganizerContent}>
        <Text style={styles.eventOrganizerLabel}>Organized by</Text>
        <View style={styles.eventOrganizerNameRow}>
          <Text style={styles.eventOrganizerName} numberOfLines={1}>
            {displayName}
          </Text>
          {verified ? (
            <VerificationBadgeWhite width={16} height={16} style={styles.eventOrganizerBadge} />
          ) : null}
        </View>
      </View>

      {canNavigate ? (
        <Feather name="chevron-right" size={20} color="#9CA3AF" style={styles.eventOrganizerChevron} />
      ) : null}
    </TouchableOpacity>
  );
};

export default EventOrganizerRow;
