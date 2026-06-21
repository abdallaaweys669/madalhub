import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import useAuth from '@/auth/useAuth';
import { getOrganizerNotificationUnreadCount } from '@/api/organizerNotifications';

const OrganizerNotificationBadgeContext = createContext(null);

export function OrganizerNotificationBadgeProvider({ children }) {
  const { isLoggedIn, userRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isLoggedIn || userRole !== 2) {
      setUnreadCount(0);
      return 0;
    }
    try {
      const { unreadCount: count } = await getOrganizerNotificationUnreadCount();
      const next = Number(count) || 0;
      setUnreadCount(next);
      return next;
    } catch {
      setUnreadCount(0);
      return 0;
    }
  }, [isLoggedIn, userRole]);

  const adjustUnreadCount = useCallback((delta) => {
    setUnreadCount((prev) => Math.max(0, prev + delta));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshUnreadCount();
    }, [refreshUnreadCount]),
  );

  const value = useMemo(
    () => ({ unreadCount, refreshUnreadCount, adjustUnreadCount, setUnreadCount }),
    [unreadCount, refreshUnreadCount, adjustUnreadCount],
  );

  return (
    <OrganizerNotificationBadgeContext.Provider value={value}>
      {children}
    </OrganizerNotificationBadgeContext.Provider>
  );
}

export function useOrganizerNotificationBadgeContext() {
  const ctx = useContext(OrganizerNotificationBadgeContext);
  if (!ctx) {
    throw new Error(
      'useOrganizerNotificationBadge must be used within OrganizerNotificationBadgeProvider',
    );
  }
  return ctx;
}
