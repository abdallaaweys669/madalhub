import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getOrganizerFollowers } from '@/api/organizer';
import OrganizerStackHeader from '@/features/organizer/components/OrganizerStackHeader';
import { initialsFromName } from '@/components/organizer/OrganizerProfileChrome';
import { formatOrganizerDate } from '@/features/organizer/utils/organizerEventUtils';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import { COLORS } from '@/theme/colors';

function FollowerRow({ item }) {
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
            backgroundColor: '#FFF7ED',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{initialsFromName(item.fullName)}</Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary }} numberOfLines={1}>
          {item.fullName}
        </Text>
        {item.followedAt ? (
          <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
            Following since {formatOrganizerDate(item.followedAt)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function OrganizerFollowersScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getOrganizerFollowers();
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
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
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <OrganizerStackHeader title="Followers" />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          <Text style={{ color: COLORS.textSecondary, marginBottom: 14, fontSize: 14 }}>
            {items.length === 0
              ? 'No followers yet'
              : `${items.length} member${items.length === 1 ? '' : 's'} follow your organization`}
          </Text>
          {items.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 15, textAlign: 'center' }}>
                Share your public organizer page to grow your audience.
              </Text>
            </View>
          ) : (
            items.map((item) => <FollowerRow key={item.memberId} item={item} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
