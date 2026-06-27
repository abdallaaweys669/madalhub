import React, { createContext, useContext, useMemo, useState } from 'react';

import useOrganizerVerificationStatusSync from '@/features/organizer/verification/hooks/useOrganizerVerificationStatusSync';

const OrganizerVerificationStatusContext = createContext(null);

export function OrganizerVerificationStatusProvider({ children }) {
  const [snapshot, setSnapshot] = useState(null);

  useOrganizerVerificationStatusSync({ onStatusSnapshot: setSnapshot });

  const value = useMemo(() => snapshot, [snapshot]);

  return (
    <OrganizerVerificationStatusContext.Provider value={value}>
      {children}
    </OrganizerVerificationStatusContext.Provider>
  );
}

export function useOrganizerVerificationSnapshot() {
  return useContext(OrganizerVerificationStatusContext);
}
