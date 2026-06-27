import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getProfileDashboard } from '@/api/organizer';
import { needsOrganizerBio } from '@/utils/organizerProfile';

export default function useOrganizerBioReminder() {
  const [needsBio, setNeedsBio] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const profile = await getProfileDashboard();
      setNeedsBio(needsOrganizerBio(profile));
    } catch {
      setNeedsBio(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { needsBio, loading, refresh };
}
