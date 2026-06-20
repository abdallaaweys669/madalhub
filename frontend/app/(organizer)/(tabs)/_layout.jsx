import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useAuth from '@/auth/useAuth';
import { useThemeColors } from '@/theme';
import useOrganizerNotificationBadge from '@/features/organizer/hooks/useOrganizerNotificationBadge';

const ROLE_ORGANIZER = 2;

export default function OrganizerTabsLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isHydrated, userRole } = useAuth();
  const { unreadCount } = useOrganizerNotificationBadge();
  const inboxBadge = unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined;

  if (!isHydrated) return null;
  if (userRole !== ROLE_ORGANIZER) return <Redirect href="/(tabs)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarBadge: inboxBadge,
          tabBarBadgeStyle: { backgroundColor: '#E53E3E', fontSize: 11 },
          tabBarIcon: ({ color }) => <Ionicons name="mail-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="organization"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={21} color={color} />,
        }}
      />
    </Tabs>
  );
}
