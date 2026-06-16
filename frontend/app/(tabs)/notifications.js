import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/theme';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications';

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data?.message) return String(data.message);
  if (error?.message && !String(error.message).startsWith('Request failed with status code')) {
    return error.message;
  }
  return fallback;
}

const TYPE_META = {
  profile_complete: { icon: 'person-circle-outline', color: '#FF7A00' },
  event_joined: { icon: 'calendar-outline', color: '#FF7A00' },
  event_saved: { icon: 'bookmark-outline', color: '#EA580C' },
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function groupNotifications(items) {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = [
    { key: 'today', title: 'Today', items: [] },
    { key: 'yesterday', title: 'Yesterday', items: [] },
    { key: 'earlier', title: 'Earlier', items: [] },
  ];

  for (const item of items) {
    const created = new Date(item.createdAt);
    const day = startOfDay(created);
    if (day.getTime() === today.getTime()) {
      groups[0].items.push(item);
    } else if (day.getTime() === yesterday.getTime()) {
      groups[1].items.push(item);
    } else {
      groups[2].items.push(item);
    }
  }

  return groups.filter((group) => group.items.length > 0);
}

function formatTimeLabel(iso) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const NotificationsScreen = () => {
  const colors = useThemeColors();
  const router = useGuardedRouter();
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async (manual = false) => {
    if (!isLoggedIn) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (manual) setRefreshing(true);
    else setLoading(true);

    setError('');
    try {
      const data = await getNotifications();
      setItems(Array.isArray(data?.items) ? data.items : []);
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load notifications'));
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(colors.background);
        StatusBar.setTranslucent(false);
      }
    }, [colors.background]),
  );

  const grouped = useMemo(() => groupNotifications(items), [items]);

  const handlePressNotification = useCallback(
    async (notification) => {
      if (!notification?.id) return;

      try {
        if (!notification.readAt) {
          await markNotificationRead(notification.id);
          setItems((prev) =>
            prev.map((row) =>
              row.id === notification.id ? { ...row, readAt: new Date().toISOString() } : row,
            ),
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch {
        // Still navigate if mark-read fails.
      }

      if (notification.actionRoute) {
        router.push(notification.actionRoute);
      }
    },
    [router],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!unreadCount) return;
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((prev) => prev.map((row) => ({ ...row, readAt: row.readAt || now })));
      setUnreadCount(0);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not mark notifications as read'));
    }
  }, [unreadCount]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.headerActions}>
          {isLoggedIn && unreadCount > 0 ? (
            <TouchableOpacity onPress={() => void handleMarkAllRead()} hitSlop={10} style={styles.markAllBtn}>
              <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={10}>
            <Feather name="settings" size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {!isLoggedIn ? (
        <View style={styles.centerWrap}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sign in to see notifications</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            Event updates, reminders, and profile tips appear here.
          </Text>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>Log in</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadNotifications(true)} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {error ? (
            <View style={[styles.errorBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{error}</Text>
            </View>
          ) : null}

          {!grouped.length && !error ? (
            <View style={styles.centerWrap}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>You&apos;re all caught up</Text>
              <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                Join or save events and we&apos;ll keep you updated here.
              </Text>
              <TouchableOpacity
                style={[styles.cta, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.9}
              >
                <Text style={styles.ctaText}>Explore Events</Text>
              </TouchableOpacity>
            </View>
          ) : (
            grouped.map((group) => (
              <View key={group.key} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{group.title}</Text>
                {group.items.map((notification) => {
                  const meta = TYPE_META[notification.type] || TYPE_META.event_joined;
                  const unread = !notification.readAt;

                  return (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notificationCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: unread ? '#FED7AA' : colors.border,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => void handlePressNotification(notification)}
                    >
                      <View style={[styles.notificationIcon, { backgroundColor: unread ? '#FFF7ED' : colors.backgroundMuted }]}>
                        <Ionicons name={meta.icon} size={22} color={meta.color} />
                      </View>
                      <View style={styles.notificationTextContainer}>
                        <Text style={[styles.notificationTitle, { color: colors.text, fontWeight: unread ? '700' : '600' }]}>
                          {notification.title}
                        </Text>
                        {notification.body ? (
                          <Text style={[styles.notificationBody, { color: colors.textSecondary }]} numberOfLines={2}>
                            {notification.body}
                          </Text>
                        ) : null}
                        <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                          {formatTimeLabel(notification.createdAt)}
                        </Text>
                      </View>
                      {unread ? <View style={styles.unreadDot} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllBtn: {
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  notificationIcon: {
    marginRight: 12,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  notificationBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF7A00',
    marginTop: 6,
    marginLeft: 8,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  cta: {
    marginTop: 18,
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});

export default NotificationsScreen;
