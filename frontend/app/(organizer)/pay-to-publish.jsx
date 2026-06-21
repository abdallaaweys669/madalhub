import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { getPublishEligibility, requestPublishCredits } from '@/api/organizer';
import { COLORS } from '@/theme/colors';

export default function PublishCreditsScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublishEligibility();
      setEligibility(data);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not load publish credits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const credits = Number(eligibility?.paidPublishCredits ?? 0);
  const pending = Boolean(eligibility?.hasPendingCreditRequest);
  const needsCredits = eligibility?.blockCode === 'CREDITS_REQUIRED';

  const onRequestCredits = async () => {
    if (pending) {
      Alert.alert('Request pending', 'You already have a credit request awaiting admin review.');
      return;
    }

    setSubmitting(true);
    try {
      await requestPublishCredits();
      Alert.alert(
        'Request sent',
        'An admin has been notified. You will receive a notification when credits are added.',
      );
      await loadData();
    } catch (error) {
      Alert.alert('Request failed', error?.message || 'Could not request publish credits.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' }}>
            Credits
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <View
          style={{
            borderRadius: 18,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
            YOUR BALANCE
          </Text>
          <Text style={{ color: COLORS.textPrimary, fontSize: 36, fontWeight: '900', marginTop: 8 }}>
            {credits}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4 }}>
            credit{credits === 1 ? '' : 's'} available
          </Text>
        </View>

        {pending ? (
          <View
            style={{
              borderRadius: 16,
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#BFDBFE',
              padding: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#1D4ED8', fontSize: 15, fontWeight: '800' }}>
              Credit request pending
            </Text>
            <Text style={{ color: '#334155', fontSize: 13, marginTop: 6, lineHeight: 20 }}>
              An admin is reviewing your request. You will be notified when credits are added.
            </Text>
          </View>
        ) : null}

        <View
          style={{
            borderRadius: 16,
            backgroundColor: '#FFF7ED',
            borderWidth: 1,
            borderColor: '#FFDBBF',
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>
            How it works
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 }}>
            After identity verification, an admin grants credits to your account. Each credit lets you publish one event live instantly.
          </Text>
        </View>

        {needsCredits && !pending ? (
          <Pressable
            onPress={onRequestCredits}
            disabled={submitting}
            style={({ pressed }) => ({
              borderRadius: 14,
              backgroundColor: pressed ? '#E56A2E' : COLORS.primary,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
                Request credits
              </Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
