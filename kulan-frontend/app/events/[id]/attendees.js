import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getEventAttendees } from '@/api/events';
import { getAnonymousDisplayName, canViewerSeeHiddenProfile } from '@/utils/anonymize';
import useAuth from '@/auth/useAuth';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';

const AttendeeRow = React.memo(({ item, onPress }) => {
  const isAnonymous = item.isAnonymous;
  const displayName = getAnonymousDisplayName(isAnonymous, item.name);

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={isAnonymous ? 1 : 0.7}
      onPress={() => onPress(item)}
      disabled={isAnonymous}
      accessibilityRole="button"
      accessibilityLabel={isAnonymous ? 'Anonymous attendee' : `View ${displayName}'s profile`}
    >
      {isAnonymous ? (
        <View style={styles.anonAvatar}>
          <Feather name="eye-off" size={16} color="#94A3B8" />
        </View>
      ) : (
        <MemberInitialAvatar name={displayName} size={48} borderWidth={0} />
      )}

      <Text style={[styles.name, isAnonymous && styles.nameMuted]} numberOfLines={1}>
        {displayName}
      </Text>

      {!isAnonymous ? <Feather name="chevron-right" size={20} color="#CBD5E1" /> : null}
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
      isAnonymous: shouldHide,
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
      setLoadError('Could not load attendees.');
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
      if (uid != null) router.push(`/profile?memberId=${uid}`);
    },
    [router],
  );

  const goBack = useCallback(() => router.back(), [router]);

  const countLabel = useMemo(() => {
    if (items.length === 0) return 'No one yet';
    if (items.length === 1) return '1 person going';
    return `${items.length} people going`;
  }, [items.length]);

  const renderItem = useCallback(
    ({ item }) => <AttendeeRow item={item} onPress={handleAttendeePress} />,
    [handleAttendeePress],
  );

  const keyExtractor = useCallback(
    (item, index) => (item.originalUserId != null ? String(item.originalUserId) : `anon-${index}`),
    [],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listIntro}>
        <Text style={styles.listIntroTitle}>Who&apos;s going</Text>
        <Text style={styles.listIntroCount}>{countLabel}</Text>
      </View>
    ),
    [countLabel],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color="#FF7B3F" />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity onPress={loadAttendees} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={8} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={32} color="#E2E8F0" />
            <Text style={styles.emptyText}>No one has joined yet</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  nav: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  listIntro: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  listIntroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  listIntroCount: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  nameMuted: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  anonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
    marginLeft: 62,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FF7B3F',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
