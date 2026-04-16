import React, { createContext, useState, useContext } from 'react';

const SavedEventsContext = createContext(null);

export function useSavedEvents() {
  return useContext(SavedEventsContext);
}

export function SavedEventsProvider({ children }) {
  const [savedEventIds, setSavedEventIds] = useState([]);

  const saveEvent = (eventId) => {
    setSavedEventIds((prevIds) => {
      if (!prevIds.includes(eventId)) {
        return [...prevIds, eventId];
      }
      return prevIds;
    });
  };

  const unsaveEvent = (eventId) => {
    setSavedEventIds((prevIds) => prevIds.filter((id) => id !== eventId));
  };

  const value = {
    savedEventIds,
    saveEvent,
    unsaveEvent,
  };

  return (
    <SavedEventsContext.Provider value={value}>
      {children}
    </SavedEventsContext.Provider>
  );
}
