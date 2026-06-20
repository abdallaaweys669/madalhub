import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OrganizerAppHeader from '@/features/organizer/components/OrganizerAppHeader';
import OrganizerDrawer from '@/features/organizer/components/OrganizerDrawer';
import OrganizerFab from '@/features/organizer/components/OrganizerFab';
import useOrganizerNotificationBadge from '@/features/organizer/hooks/useOrganizerNotificationBadge';

export default function OrganizerTabScaffold({
  title,
  children,
  showFab = true,
  orgName = '',
}) {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount } = useOrganizerNotificationBadge();

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F8' }}>
      <View style={{ paddingTop: insets.top, backgroundColor: '#FFFFFF' }}>
        <OrganizerAppHeader
          title={title}
          unreadCount={unreadCount}
          onMenuPress={() => setDrawerOpen(true)}
        />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
      {showFab ? <OrganizerFab /> : null}
      <OrganizerDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} orgName={orgName} />
    </View>
  );
}
