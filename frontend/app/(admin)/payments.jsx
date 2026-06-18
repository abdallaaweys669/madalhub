import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import adminApi from '@/api/admin';
import { COLORS } from '@/theme/colors';

function AdminNav({ active, router }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
      {[
        { key: 'organizers', label: 'Organizers', href: '/(admin)/organizers' },
        { key: 'payments', label: 'Payments', href: '/(admin)/payments' },
      ].map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => router.push(tab.href)}
          style={{
            flex: 1,
            borderRadius: 12,
            paddingVertical: 10,
            alignItems: 'center',
            backgroundColor: active === tab.key ? COLORS.primary : COLORS.card,
            borderWidth: 1,
            borderColor: active === tab.key ? COLORS.primary : COLORS.border,
          }}
        >
          <Text style={{ color: active === tab.key ? '#FFFFFF' : COLORS.textPrimary, fontWeight: '800' }}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function AdminPaymentsScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  const loadRows = useCallback(async () => {
    const data = await adminApi.getPendingPaymentRequests();
    setRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadRows();
      } catch (error) {
        if (!cancelled) Alert.alert('Error', error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRows]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRows();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const onApprove = async (id) => {
    setWorkingId(id);
    try {
      await adminApi.approvePaymentRequest(id);
      await loadRows();
    } catch (error) {
      Alert.alert('Approve failed', error.message);
    } finally {
      setWorkingId(null);
    }
  };

  const onReject = (id) => {
    Alert.alert('Reject payment', 'Reject this payment request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setWorkingId(id);
          try {
            await adminApi.rejectPaymentRequest(id);
            await loadRows();
          } catch (error) {
            Alert.alert('Reject failed', error.message);
          } finally {
            setWorkingId(null);
          }
        },
      },
    ]);
  };

  const onLogout = async () => {
    await logout();
    router.replace('/(admin)/login');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ flex: 1, fontSize: 28, fontWeight: '900', color: COLORS.textPrimary }}>Admin</Text>
          <Pressable onPress={onLogout} hitSlop={10}>
            <Feather name="log-out" size={22} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <AdminNav active="payments" router={router} />

        {rows.length === 0 ? (
          <Text style={{ color: COLORS.textSecondary, fontSize: 15 }}>No pending payment requests.</Text>
        ) : (
          rows.map((row) => (
            <View
              key={row.id}
              style={{
                borderRadius: 16,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.textPrimary }}>{row.organizerName}</Text>
              <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>{row.organizerEmail}</Text>
              <Text style={{ color: COLORS.textPrimary, marginTop: 8, fontWeight: '700' }}>
                {row.plan === 'bundle' ? 'Bundle (5 credits)' : 'Single (1 credit)'} — ${row.amountUsd}
              </Text>
              {row.paymentReference ? (
                <Text style={{ color: COLORS.textSecondary, marginTop: 6 }}>Ref: {row.paymentReference}</Text>
              ) : null}
              {row.note ? <Text style={{ color: COLORS.textMuted, marginTop: 4 }}>{row.note}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <Pressable
                  onPress={() => onApprove(row.id)}
                  disabled={workingId === row.id}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    backgroundColor: '#059669',
                    height: 42,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800' }}>
                    {workingId === row.id ? 'Working…' : 'Approve'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onReject(row.id)}
                  disabled={workingId === row.id}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    height: 42,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#B91C1C', fontWeight: '800' }}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
