import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { getOrganizerReport } from '@/api/organizer';
import OrganizerStackHeader from '@/features/organizer/components/OrganizerStackHeader';
import { resolveOrganizerReportMeta } from '@/constants/organizerReports';
import { formatCount } from '@/components/organizer/OrganizerProfileChrome';
import { buildCsv, shareCsvFile } from '@/utils/exportCsv';
import { COLORS } from '@/theme/colors';

function formatCellValue(key, value) {
  if (value == null || value === '') return '—';
  if (key === 'joinedAt' || key === 'startDate' || key === 'endDate') {
    try {
      return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'number') return formatCount(value);
  return String(value);
}

function SummaryChip({ label, value }) {
  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FFEDD5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

function OverviewMetrics({ rows }) {
  const metrics = useMemo(() => {
    const map = {};
    rows.forEach((row) => {
      map[row.metric] = row.value;
    });
    return map;
  }, [rows]);

  const cards = [
    { label: 'Total events', value: formatCount(metrics['Total events']), accent: COLORS.primary },
    { label: 'Total attendees', value: formatCount(metrics['Total attendees']), accent: '#2563EB' },
    { label: 'Drafts', value: formatCount(metrics.Drafts), accent: '#4F46E5' },
    { label: 'Upcoming', value: formatCount(metrics.Upcoming), accent: COLORS.primary },
    { label: 'Live / active', value: formatCount(metrics['Live / active']), accent: '#059669' },
    { label: 'Past events', value: formatCount(metrics['Past events']), accent: '#64748B' },
  ];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {cards.map((card) => (
        <View
          key={card.label}
          style={{
            flex: 1,
            minWidth: '46%',
            borderRadius: 16,
            padding: 14,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: `${card.accent}22`,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '900', color: card.accent }}>{card.value}</Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' }}>
            {card.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function OrganizerReportScreen({ reportType }) {
  const insets = useSafeAreaInsets();
  const meta = resolveOrganizerReportMeta(reportType);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const next = await getOrganizerReport(reportType);
    setData(next);
    setError(null);
  }, [reportType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err?.message || 'Could not load report');
        }
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
    } catch (err) {
      setError(err?.message || 'Could not refresh report');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const summaryEntries = useMemo(() => {
    if (!data?.summary || typeof data.summary !== 'object') return [];
    return Object.entries(data.summary).map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
      value: typeof value === 'number' ? formatCount(value) : String(value),
    }));
  }, [data]);

  const exportReport = async () => {
    if (!data?.columns?.length) return;
    setExporting(true);
    try {
      const csv = buildCsv(data.columns, data.rows ?? []);
      await shareCsvFile({
        csv,
        filename: `organizer-${reportType}-report.csv`,
        dialogTitle: `Export ${meta.title}`,
      });
    } catch (err) {
      setError(err?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const columns = Array.isArray(data?.columns) ? data.columns : [];
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const isOverview = reportType === 'overview';

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <OrganizerStackHeader
        title={meta.title}
        backgroundColor="#F5F5F5"
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 12,
              gap: 12,
            }}
          >
            <Text style={{ flex: 1, color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 }}>
              {meta.description}
            </Text>
            <Pressable
              onPress={exportReport}
              disabled={exporting || !rows.length}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                  opacity: !rows.length ? 0.5 : 1,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="download" size={16} color="#FFFFFF" />
              )}
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Export CSV</Text>
            </Pressable>
          </View>

          {error ? (
            <Text style={{ color: '#DC2626', marginBottom: 12, fontSize: 14 }}>{error}</Text>
          ) : null}

          {summaryEntries.length > 0 && !isOverview ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {summaryEntries.map((item) => (
                <SummaryChip key={item.label} label={item.label} value={item.value} />
              ))}
            </View>
          ) : null}

          {isOverview ? (
            <OverviewMetrics rows={rows} />
          ) : rows.length === 0 ? (
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              No data yet for this report.
            </Text>
          ) : (
            rows.map((row, index) => (
              <View
                key={String(row.eventId ?? row.registrationId ?? row.rank ?? index)}
                style={{
                  borderRadius: 14,
                  backgroundColor: COLORS.card,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 14,
                  marginBottom: 8,
                }}
              >
                {columns.map((col) => (
                  <View
                    key={col.key}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '600' }}>
                      {col.label}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        textAlign: 'right',
                        color: COLORS.textPrimary,
                        fontSize: 13,
                        fontWeight: col.key === 'title' || col.key === 'eventTitle' ? '700' : '500',
                      }}
                      numberOfLines={3}
                    >
                      {formatCellValue(col.key, row[col.key])}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
