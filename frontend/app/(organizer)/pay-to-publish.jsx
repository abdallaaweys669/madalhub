import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import {
  createPaymentRequest,
  getMyPaymentRequests,
  getPaymentConfig,
} from '@/api/organizer';
import { COLORS } from '@/theme/colors';

const PLAN_OPTIONS = [
  { key: 'single', title: 'Single publish', subtitle: '1 event credit' },
  { key: 'bundle', title: 'Bundle', subtitle: '5 event credits' },
];

function PlanCard({ plan, selected, priceLabel, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 16,
        borderWidth: 2,
        borderColor: selected ? COLORS.primary : COLORS.border,
        backgroundColor: pressed ? '#FFF7ED' : selected ? '#FFF7ED' : COLORS.card,
        padding: 16,
        marginBottom: 10,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' }}>{plan.title}</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }}>{plan.subtitle}</Text>
        </View>
        <Text style={{ color: COLORS.primary, fontSize: 20, fontWeight: '900' }}>{priceLabel}</Text>
      </View>
    </Pressable>
  );
}

export default function PayToPublishScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState(null);
  const [plan, setPlan] = useState('single');
  const [paymentReference, setPaymentReference] = useState('');
  const [note, setNote] = useState('');
  const [pendingRequest, setPendingRequest] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentConfig, requests] = await Promise.all([
        getPaymentConfig(),
        getMyPaymentRequests().catch(() => []),
      ]);
      setConfig(paymentConfig);
      const pending = Array.isArray(requests)
        ? requests.find((row) => row.status === 'pending')
        : null;
      setPendingRequest(pending ?? null);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not load payment details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const priceLabels = useMemo(
    () => ({
      single: `$${Number(config?.single?.priceUsd ?? 5)}`,
      bundle: `$${Number(config?.bundle?.priceUsd ?? 20)}`,
    }),
    [config],
  );

  const onSubmit = async () => {
    if (pendingRequest) {
      Alert.alert('Payment pending', 'You already have a payment request awaiting admin approval.');
      return;
    }

    setSubmitting(true);
    try {
      await createPaymentRequest({
        plan,
        paymentReference: paymentReference.trim() || undefined,
        note: note.trim() || undefined,
      });
      setSubmitted(true);
      await loadData();
    } catch (error) {
      Alert.alert('Submit failed', error?.message || 'Could not submit payment request.');
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
            Pay to publish
          </Text>
          <View style={{ width: 30 }} />
        </View>

        {(submitted || pendingRequest) && (
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
              Payment submitted — awaiting approval
            </Text>
            <Text style={{ color: '#334155', fontSize: 13, marginTop: 6, lineHeight: 20 }}>
              An admin will review your payment and add publish credits to your account.
            </Text>
          </View>
        )}

        <View
          style={{
            borderRadius: 18,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
            SEND PAYMENT TO
          </Text>
          <Text selectable style={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 8 }}>
            {config?.paymentPhone || 'Contact support for payment details'}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 20 }}>
            Send mobile money to the number above, then submit your plan and payment reference below.
          </Text>
        </View>

        <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>
          Choose a plan
        </Text>

        {PLAN_OPTIONS.map((option) => (
          <PlanCard
            key={option.key}
            plan={option}
            selected={plan === option.key}
            priceLabel={priceLabels[option.key]}
            onPress={() => setPlan(option.key)}
          />
        ))}

        <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 8 }}>
          Payment reference
        </Text>
        <TextInput
          value={paymentReference}
          onChangeText={setPaymentReference}
          placeholder="Transaction ID or reference"
          placeholderTextColor={COLORS.textMuted}
          style={{
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 123, 63, 0.28)',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: COLORS.textPrimary,
            marginBottom: 12,
          }}
        />

        <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>
          Note (optional)
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Any extra details for the admin"
          placeholderTextColor={COLORS.textMuted}
          multiline
          style={{
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 123, 63, 0.28)',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: COLORS.textPrimary,
            minHeight: 88,
            textAlignVertical: 'top',
            marginBottom: 18,
          }}
        />

        <Pressable
          onPress={onSubmit}
          disabled={submitting || Boolean(pendingRequest)}
          style={({ pressed }) => ({
            borderRadius: 14,
            backgroundColor: pendingRequest ? '#CBD5E1' : pressed ? '#E56A2E' : COLORS.primary,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
              {pendingRequest ? 'Awaiting admin approval' : 'Submit payment request'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
