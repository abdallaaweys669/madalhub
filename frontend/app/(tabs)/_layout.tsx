import React, { useEffect } from "react";
import { Redirect, Tabs, useSegments } from "expo-router";

import { hrefFromTabsSegments, rememberMemberTabsHref } from "@/navigation/memberTabsReturn";
import { getOrganizerEntryHref } from "@/navigation/organizerGate";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAuth from "@/auth/useAuth";
import { getEvents } from "@/api/events";
import { useThemeColors } from "@/theme";
import useMemberNotificationBadge from "@/hooks/useMemberNotificationBadge";

const ROLE_ORGANIZER = 2;

export default function TabLayout() {
  const colors = useThemeColors();
  const { isHydrated, isLoggedIn, profileCompleted, userRole, organizerStatus, user } = useAuth();
  const { unreadCount } = useMemberNotificationBadge();
  const notifBadge = unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined;


  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const isOnboarding = segments[0] === "onboarding";

  useEffect(() => {
    if (segments[0] === "(tabs)") {
      rememberMemberTabsHref(hrefFromTabsSegments(segments));
    }
  }, [segments]);

  useEffect(() => {
    if (!isHydrated || userRole === ROLE_ORGANIZER) return;
    const frame = requestAnimationFrame(() => {
      getEvents({ page: 1, limit: 50, sort: "start-asc" }).catch(() => {});
    });
    return () => cancelAnimationFrame(frame);
  }, [isHydrated, userRole]);

  if (!isHydrated) return null;

  if (isLoggedIn && profileCompleted === false) {
    return <Redirect href="/onboarding/WelcomeIntro" />;
  }

  if (userRole === ROLE_ORGANIZER) {
    return <Redirect href={getOrganizerEntryHref(organizerStatus, user?.id)} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,

        tabBarStyle: {
          display: isOnboarding ? "none" : "flex",
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discovery',
          tabBarIcon: ({ color }) => <Feather name="compass" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarBadge: notifBadge,
          tabBarBadgeStyle: { backgroundColor: '#E53E3E', fontSize: 11 },
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Feather name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}