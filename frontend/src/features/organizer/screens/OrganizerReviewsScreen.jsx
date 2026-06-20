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

import useAuth from '@/auth/useAuth';
import { getOrganizerReviews } from '@/api/organizer';
import OrganizerStackHeader from '@/features/organizer/components/OrganizerStackHeader';
import { initialsFromName } from '@/components/organizer/OrganizerProfileChrome';
import { formatOrganizerDate } from '@/features/organizer/utils/organizerEventUtils';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import { COLORS } from '@/theme/colors';

function StarRow({ rating }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ color: star <= rating ? '#F59E0B' : '#E5E7EB', fontSize: 14 }}>
          ★
        </Text>
      ))}
    </View>
  );
}

function ReviewRow({ item }) {
  const avatarUri = resolveApiAssetUrl(item.memberProfileImg);

  return (
    <View
      style={{
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFF7ED',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 12 }}>
              {initialsFromName(item.memberName)}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.textPrimary }} numberOfLines={1}>
            {item.memberName}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{formatOrganizerDate(item.createdAt)}</Text>
        </View>
      </View>
      <StarRow rating={item.rating} />
      {item.comment ? (
        <Text style={{ marginTop: 8, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 }}>{item.comment}</Text>
      ) : null}
    </View>
  );
}

export default function OrganizerReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    const data = await getOrganizerReviews(user.id);
    setItems(Array.isArray(data) ? data : []);
  }, [user?.id]);

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

  const average =
    items.length > 0
      ? (items.reduce((sum, row) => sum + Number(row.rating || 0), 0) / items.length).toFixed(1)
      : '0.0';

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <OrganizerStackHeader title="Reviews" />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          <View
            style={{
              borderRadius: 16,
              backgroundColor: '#FFF7ED',
              borderWidth: 1,
              borderColor: '#FED7AA',
              padding: 16,
              marginBottom: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#9A3412' }}>{average}</Text>
            <Text style={{ color: '#B45309', marginTop: 4 }}>
              {items.length} review{items.length === 1 ? '' : 's'}
            </Text>
          </View>
          {items.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 15, textAlign: 'center' }}>
                Member reviews will appear here after they rate your organization.
              </Text>
            </View>
          ) : (
            items.map((item) => <ReviewRow key={item.id} item={item} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
