import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getEventAttendees } from '@/api/events';
import { getAnonymousDisplayName, getAnonymousAvatar, canViewerSeeHiddenProfile } from '@/utils/anonymize';
import useAuth from '@/auth/useAuth';

function AnonymousAvatar() {
  return (
    <View style={styles.anonymousAvatar} accessibilityLabel="Anonymous member avatar">
      <Feather name="eye-off" size={16} color="#9CA3AF" />
    </View>
  );
}

function RealAvatar({ avatarUrl }) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.avatarImage} accessibilityLabel="Member avatar" />;
  }
  return (
    <View style={styles.avatarFallback} accessibilityLabel="Default member avatar">
      <Feather name="user" size={16} color="#FFFFFF" />
    </View>
  );
}

const AttendeeRow = React.memo(({ item, onPress }) => {
  const isAnonymous = item.isAnonymous;
  const displayName = getAnonymousDisplayName(isAnonymous, item.name);
  const avatarUrl = getAnonymousAvatar(item.avatarUrl, isAnonymous);

  return (
    <TouchableOpacity
      style={styles.attendeeRow}
      activeOpacity={isAnonymous ? 1 : 0.65}
      onPress={() => onPress(item)}
      disabled={isAnonymous}
      accessibilityRole="button"
      accessibilityLabel={isAnonymous ? `Anonymous attendee` : `View ${displayName}'s profile`}
      accessibilityState={{ disabled: isAnonymous }}
    >
      {isAnonymous ? <AnonymousAvatar /> : <RealAvatar avatarUrl={avatarUrl} />}
      <View style={styles.attendeeTextCol}>
        <Text style={[styles.attendeeName, isAnonymous && styles.anonymousName]} numberOfLines={1}>
          {displayName}
        </Text>
        {isAnonymous ? (
          <Text style={styles.anonymousBadge}>Private profile</Text>
        ) : null}
      </View>
      {!isAnonymous ? (
        <Feather name="chevron-right" size={18} color="#D1D5DB" />
      ) : null}
    </TouchableOpacity>
  );
});

function formatAttendees(rawItems, canReveal, viewerId) {
  return rawItems.map((att) => {
    const anon = Boolean(att.isAnonymous);
    const uid = att.userId ?? att.id;
    const isSelf = viewerId != null && uid != null && Number(viewerId) === Number(uid);
    const shouldHide = anon && !isSelf && !canReveal;
    return {
      originalUserId: uid,
      id: shouldHide ? null : uid,
      name: att.name || 'Member',
      avatarUrl: shouldHide ? null : (att.avatarUrl ?? null),
      isAnonymous: shouldHide,
      joinedAt: att.joinedAt ?? null,
    };
  });
}

export default function EventAttendeesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, userRole } = useAuth();
  const eventId = Array.isArray(id) ? id[0] : id;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const mountedRef = useRef(true);

  const viewerId = user?.id ?? user?.sub ?? null;
  const canReveal = canViewerSeeHiddenProfile(userRole);

  const loadAttendees = useCallback(async () => {
    if (!eventId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError('');
    try {
      const payload = await getEventAttendees(eventId, { page: 1, limit: 100 });
      if (!mountedRef.current) return;
      const raw = Array.isArray(payload?.items) ? payload.items : [];
      setItems(formatAttendees(raw, canReveal, viewerId));
    } catch {
      if (!mountedRef.current) return;
      setLoadError('Could not load attendees right now.');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [eventId, canReveal, viewerId]);

  useEffect(() => {
    mountedRef.current = true;
    loadAttendees();
    return () => {
      mountedRef.current = false;
    };
  }, [loadAttendees, eventId]);

  const handleAttendeePress = useCallback(
    (att) => {
      if (att.isAnonymous) return;
      const uid = att.originalUserId ?? att.id;
      if (uid != null) {
        router.push(`/profile?memberId=${uid}`);
      }
    },
    [router],
  );

  const keyExtractor = useCallback((item, index) => (item.originalUserId != null ? String(item.originalUserId) : `anon-${index}`), []);

  const renderItem = useCallback(
    ({ item }) => <AttendeeRow item={item} onPress={handleAttendeePress} />,
    [handleAttendeePress],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.headerTitle}>Members going</Text>
        <Text style={styles.headerCount}>{items.length} attending</Text>
      </View>
    ),
    [items.length],
  );

  const emptyComponent = useMemo(
    () =>
      !isLoading && !loadError ? (
        <View style={styles.centeredState}>
          <Feather name="users" size={32} color="#D1D5DB" />
          <Text style={styles.emptyText}>No attendees yet.</Text>
          <Text style={styles.emptySubtext}>Be the first to join this event.</Text>
        </View>
      ) : null,
    [isLoading, loadError],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Go back">
            <Feather name="arrow-left" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Members going</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredState}>
          <ActivityIndicator size="small" color="#FF7A00" />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Go back">
            <Feather name="arrow-left" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Members going</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredState}>
          <Feather name="alert-circle" size={32} color="#9CA3AF" />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity onPress={loadAttendees} style={styles.retryBtn} accessibilityRole="button" accessibilityLabel="Retry loading attendees">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members going</Text>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={items.length > 0 ? listHeader : null}
        ListEmptyComponent={emptyComponent}
        initialNumToRender={20}
        maxToRenderPerBatch={15}
        windowSize={10}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 36,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 10,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FF7A00',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 10,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#D1D5DB',
    marginTop: 4,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  attendeeTextCol: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  attendeeName: {
    fontSize: 15,
    color: '#2D3440',
    fontWeight: '600',
  },
  anonymousName: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  anonymousBadge: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '500',
    marginTop: 2,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
