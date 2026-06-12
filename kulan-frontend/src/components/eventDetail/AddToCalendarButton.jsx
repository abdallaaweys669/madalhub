import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { addEventToCalendar } from '@/utils/eventRegistration';

const AddToCalendarButton = ({ event }) => {
  const [busy, setBusy] = useState(false);

  const handlePress = useCallback(async () => {
    if (busy || !event) return;

    setBusy(true);
    try {
      await addEventToCalendar(event);
    } finally {
      setBusy(false);
    }
  }, [busy, event]);

  return (
    <TouchableOpacity
      style={styles.addToCalendarBtn}
      onPress={handlePress}
      disabled={busy}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel="Add to calendar"
    >
      {busy ? (
        <ActivityIndicator size="small" color="#FF7A00" />
      ) : (
        <Feather name="calendar" size={17} color="#FF7A00" />
      )}
      <Text style={styles.addToCalendarText}>Add to calendar</Text>
    </TouchableOpacity>
  );
};

export default AddToCalendarButton;
