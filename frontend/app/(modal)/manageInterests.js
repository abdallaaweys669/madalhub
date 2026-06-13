import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Chip from '@/features/onboarding/components/Chip';
import { INTEREST_ICON_MAP } from '@/features/onboarding/data/interestIconMap';
import onboardingApi from '@/api/onboarding';

const BRAND = '#FF7A00';

export default function ManageInterestsScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const [catalog, setCatalog] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allInterests, mine] = await Promise.all([
        onboardingApi.getInterests(),
        onboardingApi.getMyInterests(),
      ]);
      setCatalog(Array.isArray(allInterests) ? allInterests : []);
      const mineIds = (Array.isArray(mine) ? mine : []).map((row) => Number(row.id));
      setSelectedIds(mineIds);
    } catch (e) {
      setError(e?.message || 'Could not load interests.');
      setCatalog([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id) => {
    const n = Number(id);
    setSelectedIds((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onboardingApi.updateInterests(selectedIds);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/profile');
      }
    } catch (e) {
      setError(e?.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Interests' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>What are you interested in?</Text>
          <Text style={styles.subtitle}>
            Choose from all categories in our catalog. You can select one, several, or all — we use this to
            recommend events near you.
          </Text>
          <Text style={styles.counterValue}>{selectedIds.length} selected</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color={BRAND} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.grid}>
            {catalog.map((item) => {
              const id = Number(item.id);
              const selected = selectedIds.includes(id);
              return (
                <Chip
                  key={id}
                  label={item.name}
                  iconSpec={INTEREST_ICON_MAP[item.name]}
                  selected={selected}
                  onPress={() => toggle(id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 120 },
  header: { paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 12 },
  counterValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, marginTop: 8 },
  errorText: { color: '#B91C1C', marginHorizontal: 24, marginTop: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveButton: {
    backgroundColor: BRAND,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonDisabled: { opacity: 0.75 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
