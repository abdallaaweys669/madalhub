import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import useAuth from '@/auth/useAuth';
import { getOrganizerNotificationUnreadCount } from '@/api/organizerNotifications';

export default function useOrganizerNotificationBadge() {
  const { isLoggedIn, userRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isLoggedIn || userRole !== 2) {
      setUnreadCount(0);
      return;
    }
    try {
      const { unreadCount: count } = await getOrganizerNotificationUnreadCount();
      setUnreadCount(Number(count) || 0);
    } catch {
      setUnreadCount(0);
    }
  }, [isLoggedIn, userRole]);

  useFocusEffect(
    useCallback(() => {
      void refreshUnreadCount();
    }, [refreshUnreadCount]),
  );

  return { unreadCount, refreshUnreadCount };
}
