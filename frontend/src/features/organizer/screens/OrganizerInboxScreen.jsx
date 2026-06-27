import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useGuardedRouter from '@/hooks/useGuardedRouter';

import OrganizerTabScaffold from '@/features/organizer/components/OrganizerTabScaffold';
import useOrganizerDashboardData from '@/features/organizer/hooks/useOrganizerDashboardData';
import useOrganizerNotificationBadge from '@/features/organizer/hooks/useOrganizerNotificationBadge';
import {
  getOrganizerNotifications,
  markAllOrganizerNotificationsRead,
  markOrganizerNotificationRead,
} from '@/api/organizerNotifications';
import {
  isOrganizerVerificationNotificationVisible,
  shouldFollowOrganizerNotificationRoute,
} from '@/features/organizer/utils/organizerNotificationUtils';
import { useThemeColors } from '@/theme';

const TYPE_META = {
  verification_approved: { icon: 'checkmark-circle-outline', color: '#059669' },
  verification_rejected: { icon: 'alert-circle-outline', color: '#DC2626' },
  payment_approved: { icon: 'card-outline', color: '#2563EB' },
  payment_rejected: { icon: 'close-circle-outline', color: '#DC2626' },
  event_registration: { icon: 'people-outline', color: '#FF7B3F' },
};

function groupNotifications(items) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = { Today: [], Yesterday: [], Earlier: [] };
  items.forEach((item) => {
    const d = new Date(item.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups.Today.push(item);
    else if (d.getTime() === yesterday.getTime()) groups.Yesterday.push(item);
    else groups.Earlier.push(item);
  });
  return groups;
}

export default function OrganizerInboxScreen() {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { organizationName, headerFullName, verificationStatus } = useOrganizerDashboardData();
  const { refreshUnreadCount, adjustUnreadCount, setUnreadCount } = useOrganizerNotificationBadge();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const orgLabel = organizationName || headerFullName || 'Organizer';

  const load = useCallback(async () => {
    const data = await getOrganizerNotifications();
    const raw = Array.isArray(data?.items) ? data.items : [];
    setItems(
      raw.filter((item) =>
        isOrganizerVerificationNotificationVisible(item, verificationStatus),
      ),
    );
    await refreshUnreadCount();
  }, [refreshUnreadCount, verificationStatus]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          await load();
        } catch {
          if (!cancelled) setItems([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const onPressItem = async (item) => {
    try {
      if (!item.readAt) {
        await markOrganizerNotificationRead(item.id);
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row,
          ),
        );
        adjustUnreadCount(-1);
        void refreshUnreadCount();
      }
      if (shouldFollowOrganizerNotificationRoute(item, verificationStatus)) {
        router.push(item.actionRoute);
      }
    } catch {
      if (shouldFollowOrganizerNotificationRoute(item, verificationStatus)) {
        router.push(item.actionRoute);
      }
    }
  };

  const onMarkAllRead = async () => {
    try {
      await markAllOrganizerNotificationsRead();
      const now = new Date().toISOString();
      setItems((prev) => prev.map((row) => ({ ...row, readAt: row.readAt || now })));
      setUnreadCount(0);
      void refreshUnreadCount();
    } catch {
      await load();
    }
  };

  const groups = groupNotifications(items);

  return (
    <OrganizerTabScaffold title="Inbox" orgName={orgLabel} showFab={false}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        >
          {items.some((i) => !i.readAt) ? (
            <Pressable onPress={onMarkAllRead} style={{ alignSelf: 'flex-end', marginBottom: 12 }}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Mark all read</Text>
            </Pressable>
          ) : null}

          {items.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="mail-open-outline" size={48} color="#CBD5E1" />
              <Text style={{ marginTop: 12, fontSize: 17, fontWeight: '800', color: '#0F172A' }}>Inbox is empty</Text>
              <Text style={{ marginTop: 6, color: '#64748B', textAlign: 'center' }}>
                Verification updates, payments, and registrations will appear here.
              </Text>
            </View>
          ) : (
            Object.entries(groups).map(([label, rows]) =>
              rows.length === 0 ? null : (
                <View key={label} style={{ marginBottom: 18 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 }}>
                    {label.toUpperCase()}
                  </Text>
                  {rows.map((item) => {
                    const meta = TYPE_META[item.type] || { icon: 'notifications-outline', color: colors.primary };
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => onPressItem(item)}
                        style={{
                          backgroundColor: item.readAt ? '#fff' : '#FFF7ED',
                          borderRadius: 14,
                          padding: 14,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: '#E7E7EA',
                          flexDirection: 'row',
                          gap: 12,
                        }}
                      >
                        <Ionicons name={meta.icon} size={22} color={meta.color} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '800', color: '#0F172A' }}>{item.title}</Text>
                          {item.body ? (
                            <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                              {item.body}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ),
            )
          )}
        </ScrollView>
      )}
    </OrganizerTabScaffold>
  );
}
