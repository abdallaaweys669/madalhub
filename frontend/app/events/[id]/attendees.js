import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Feather } from '@expo/vector-icons';
import { getEventAttendees, getEventById } from '@/api/events';
import { getAnonymousDisplayName, canViewerSeeHiddenProfile } from '@/utils/anonymize';
import useAuth from '@/auth/useAuth';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import AttendeeSubtitle from '@/components/eventDetail/AttendeeSubtitle';

function formatJoinedRelative(iso) {
  if (!iso) return null;
  const joined = new Date(iso);
  if (!Number.isFinite(joined.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfJoined = new Date(joined.getFullYear(), joined.getMonth(), joined.getDate());
  const dayDiff = Math.round((startOfToday - startOfJoined) / 86400000);

  if (dayDiff <= 0) return 'Joined today';
  if (dayDiff === 1) return 'Joined yesterday';
  return `Joined ${dayDiff} days ago`;
}

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
      avatarUrl: shouldHide ? null : att.avatarUrl ?? null,
      location: shouldHide ? null : att.location ?? null,
      subtitle: shouldHide ? null : att.subtitle ?? null,
      joinedAt: att.joinedAt ?? null,
      isAnonymous: shouldHide,
    };
  });
}

function AttendeeAvatar({ item, size = 52 }) {
  const displayName = getAnonymousDisplayName(item.isAnonymous, item.name);
  const avatarUri = typeof item.avatarUrl === 'string' ? item.avatarUrl.trim() : '';
  const [useInitials, setUseInitials] = useState(!avatarUri);

  useEffect(() => {
    setUseInitials(!avatarUri);
  }, [avatarUri, item.originalUserId]);

  if (item.isAnonymous) {
    return (
      <View style={[styles.anonAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <Feather name="eye-off" size={16} color="#94A3B8" />
      </View>
    );
  }

  if (avatarUri && !useInitials) {
    return (
      <Image
        source={{ uri: avatarUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
        onError={() => setUseInitials(true)}
      />
    );
  }

  return <MemberInitialAvatar name={displayName} size={size} borderWidth={0} />;
}

const AttendeeRow = React.memo(({ item, onPress, isFirst, isLast }) => {
  const isAnonymous = item.isAnonymous;
  const displayName = getAnonymousDisplayName(isAnonymous, item.name);
  const joinedLabel = formatJoinedRelative(item.joinedAt);

  return (
    <TouchableOpacity
      style={[styles.row, isFirst ? styles.rowFirst : null, isLast ? styles.rowLast : null]}
      activeOpacity={isAnonymous ? 1 : 0.75}
      onPress={() => onPress(item)}
      disabled={isAnonymous}
      accessibilityRole="button"
      accessibilityLabel={isAnonymous ? 'Anonymous attendee' : `View ${displayName}'s profile`}
    >
      <AttendeeAvatar item={item} />

      <View style={styles.rowBody}>
        <Text style={[styles.name, isAnonymous && styles.nameMuted]} numberOfLines={1}>
          {displayName}
        </Text>

        {!isAnonymous && item.subtitle ? (
          <AttendeeSubtitle text={item.subtitle} style={styles.subtitleText} />
        ) : null}

        {!isAnonymous && item.location ? (
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={12} color="#94A3B8" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        ) : null}

        {!isAnonymous && joinedLabel ? (
          <Text style={styles.joinedText}>{joinedLabel}</Text>
        ) : null}
      </View>

      {!isAnonymous ? <Feather name="chevron-right" size={20} color="#FF7B3F" /> : null}
    </TouchableOpacity>
  );
});

export default function EventAttendeesScreen() {
  const { id } = useLocalSearchParams();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user, userRole } = useAuth();
  const eventId = Array.isArray(id) ? id[0] : id;
  const [items, setItems] = useState([]);
  const [eventTitle, setEventTitle] = useState('');
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
      const [payload, event] = await Promise.all([
        getEventAttendees(eventId, { page: 1, limit: 100 }),
        getEventById(eventId).catch(() => null),
      ]);
      if (!mountedRef.current) return;
      const raw = Array.isArray(payload?.items) ? payload.items : [];
      setItems(formatAttendees(raw, canReveal, viewerId));
      setEventTitle(typeof event?.title === 'string' ? event.title.trim() : '');
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
      if (uid != null) router.push(`/profile?memberId=${uid}&from=attendees`);
    },
    [router],
  );

  const handleInvite = useCallback(async () => {
    const title = eventTitle || 'this event';
    try {
      await Share.share({
        message: `Join me at ${title} on Kulan!`,
      });
    } catch {
      /* user dismissed */
    }
  }, [eventTitle]);

  const goBack = useCallback(() => router.back(), [router]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <AttendeeRow
        item={item}
        onPress={handleAttendeePress}
        isFirst={index === 0}
        isLast={index === items.length - 1}
      />
    ),
    [handleAttendeePress, items.length],
  );

  const keyExtractor = useCallback(
    (item, index) => (item.originalUserId != null ? String(item.originalUserId) : `anon-${index}`),
    [],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Text style={styles.screenTitle}>Who&apos;s going</Text>
        <Text style={styles.screenSubtitle}>People who are going to this event</Text>

        <View style={styles.sectionHeading}>
          <Feather name="users" size={16} color="#FF7B3F" />
          <Text style={styles.sectionHeadingText}>Attendees ({items.length})</Text>
        </View>
      </View>
    ),
    [items.length],
  );

  const listFooter = useMemo(
    () => <View style={styles.listSpacer} />,
    [],
  );

  const bottomPanel = (
    <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.inviteCard}>
        <View style={styles.inviteIconWrap}>
          <Feather name="user-plus" size={18} color="#FF7B3F" />
        </View>
        <View style={styles.inviteTextWrap}>
          <Text style={styles.inviteTitle}>Invite your friends</Text>
          <Text style={styles.inviteHint}>The more, the merrier!</Text>
        </View>
        <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite} activeOpacity={0.9}>
          <Text style={styles.inviteBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerNoteWrap}>
        <Feather name="info" size={14} color="#94A3B8" />
        <View style={styles.footerNoteTextWrap}>
          <Text style={styles.footerNoteTitle}>Browse Attendees</Text>
          <Text style={styles.footerNoteBody}>Tap an attendee to view their profile and contact them.</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} style={styles.iconBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color="#FF7B3F" />
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
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} style={styles.iconBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color="#FF7B3F" />
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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBack} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color="#FF7B3F" />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 ? styles.listContentEmpty : null,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Feather name="users" size={28} color="#E2E8F0" />
            <Text style={styles.emptyText}>No one has joined yet</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {bottomPanel}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listSpacer: {
    height: 8,
  },
  bottomPanel: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerBlock: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 21,
  },
  sectionHeading: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF7B3F',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F1F5F9',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  nameMuted: {
    color: '#94A3B8',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  subtitleText: {
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  joinedText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  anonAvatar: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 0,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FFE8D9',
    gap: 12,
  },
  inviteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  inviteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  inviteHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  inviteBtn: {
    backgroundColor: '#FF7B3F',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footerNoteWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  footerNoteTextWrap: {
    flex: 1,
  },
  footerNoteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  footerNoteBody: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 17,
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
