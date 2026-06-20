import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getOrganizerAttendees } from '@/api/organizer';
import OrganizerStackHeader from '@/features/organizer/components/OrganizerStackHeader';
import { formatOrganizerDateTime } from '@/features/organizer/utils/organizerEventUtils';
import { initialsFromName } from '@/components/organizer/OrganizerProfileChrome';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import { COLORS } from '@/theme/colors';

function AttendeeRow({ item }) {
  const avatarUri = resolveApiAssetUrl(item.profileImg);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 10,
      }}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={{ width: 44, height: 44, borderRadius: 22 }} />
      ) : (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#EFF6FF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#2563EB', fontWeight: '800' }}>{initialsFromName(item.fullName)}</Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary }} numberOfLines={1}>
          {item.fullName}
        </Text>
        <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }} numberOfLines={1}>
          {item.eventTitle}
        </Text>
        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
          Joined {formatOrganizerDateTime(item.joinedAt)}
        </Text>
      </View>
    </View>
  );
}

export default function OrganizerAttendeesScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const loadPage = useCallback(async (pageNum, replace = false) => {
    const data = await getOrganizerAttendees({ page: pageNum, limit: 20 });
    const nextItems = Array.isArray(data?.items) ? data.items : [];
    setItems((prev) => (replace ? nextItems : [...prev, ...nextItems]));
    setPage(data?.page ?? pageNum);
    setHasMore(Boolean(data?.hasMore));
    setTotal(Number(data?.total ?? 0));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadPage(1, true);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPage(1, true);
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadPage(page + 1, false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loadPage, page]);

  const summary = useMemo(() => {
    if (total === 0) return 'No registrations yet';
    return `${total} registration${total === 1 ? '' : 's'} across your events`;
  }, [total]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <OrganizerStackHeader title="Attendees" />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) {
              onLoadMore();
            }
          }}
          scrollEventThrottle={200}
        >
          <Text style={{ color: COLORS.textSecondary, marginBottom: 14, fontSize: 14 }}>{summary}</Text>
          {items.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 15, textAlign: 'center' }}>
                When members register for your events, they will appear here.
              </Text>
            </View>
          ) : (
            items.map((item) => <AttendeeRow key={item.registrationId} item={item} />)
          )}
          {loadingMore ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
