import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import useAuth from '@/auth/useAuth';
import {
  getSavedEvents as getSavedEventsApi,
  saveEvent as saveEventApi,
  unsaveEvent as unsaveEventApi,
} from '@/api/events';

const SavedEventsContext = createContext(null);

export function useSavedEvents() {
  return useContext(SavedEventsContext);
}

export function SavedEventsProvider({ children }) {
  const { isLoggedIn, isHydrated, isMember } = useAuth();
  const [savedEventIds, setSavedEventIds] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [isSyncingSaved, setIsSyncingSaved] = useState(false);

  const refreshSavedEvents = useCallback(async () => {
    if (!isLoggedIn || !isMember) {
      setSavedEventIds([]);
      setSavedEvents([]);
      return;
    }

    setIsSyncingSaved(true);
    try {
      const list = await getSavedEventsApi();
      setSavedEvents(list);
      setSavedEventIds(list.map((event) => String(event.id)));
    } catch {
      // Keep existing state if request fails.
    } finally {
      setIsSyncingSaved(false);
    }
  }, [isLoggedIn, isMember]);

  useEffect(() => {
    if (!isHydrated) return;
    refreshSavedEvents();
  }, [isHydrated, refreshSavedEvents]);

  const saveEvent = async (eventId) => {
    if (!isMember) return;
    const normalizedId = String(eventId);

    if (isLoggedIn) {
      try {
        await saveEventApi(normalizedId);
      } catch {
        return;
      }
    }

    setSavedEventIds((prevIds) => {
      if (!prevIds.includes(normalizedId)) {
        return [...prevIds, normalizedId];
      }
      return prevIds;
    });
  };

  const unsaveEvent = async (eventId) => {
    if (!isMember) return;
    const normalizedId = String(eventId);

    if (isLoggedIn) {
      try {
        await unsaveEventApi(normalizedId);
      } catch {
        return;
      }
    }

    setSavedEventIds((prevIds) => prevIds.filter((id) => id !== normalizedId));
  };

  const value = {
    savedEventIds,
    savedEvents,
    saveEvent,
    unsaveEvent,
    isSyncingSaved,
    refreshSavedEvents,
  };

  return (
    <SavedEventsContext.Provider value={value}>
      {children}
    </SavedEventsContext.Provider>
  );
}
