import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SESSION_FORMAT_OPTIONS } from '@/constants/eventFormats';
import { formatKeyToDisplayLabel } from '@/constants/eventFormatLabels';

function sessionFormatLabel(key) {
  const found = SESSION_FORMAT_OPTIONS.find((s) => s.key === key);
  return found?.label || formatKeyToDisplayLabel(key);
}

function formatSessionWhen(startRaw, endRaw) {
  const start = startRaw ? new Date(startRaw) : null;
  const end = endRaw ? new Date(endRaw) : null;
  if (!start || !Number.isFinite(start.getTime())) return '';
  const day = start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const endTime =
    end && Number.isFinite(end.getTime())
      ? end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : '';
  return endTime ? `${day} · ${startTime} – ${endTime}` : `${day} · ${startTime}`;
}

export default function EventAgendaSection({ sessions }) {
  const rows = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    return [...sessions].sort((a, b) => {
      const ao = Number(a?.sortOrder ?? 0);
      const bo = Number(b?.sortOrder ?? 0);
      if (ao !== bo) return ao - bo;
      return new Date(a?.startsAt ?? a?.startDatetime).getTime() - new Date(b?.startsAt ?? b?.startDatetime).getTime();
    });
  }, [sessions]);

  if (rows.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Agenda</Text>
      {rows.map((session, index) => (
        <View key={String(session.id ?? index)} style={styles.row}>
          <View style={styles.timelineCol}>
            <View style={styles.dot} />
            {index < rows.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <View style={styles.body}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <View style={styles.formatRow}>
              <Feather name="layers" size={13} color="#EA580C" />
              <Text style={styles.formatText}>{sessionFormatLabel(session.sessionFormat)}</Text>
            </View>
            <Text style={styles.whenText}>
              {formatSessionWhen(session.startsAt ?? session.startDatetime, session.endsAt ?? session.endDatetime)}
            </Text>
            {session.speakerNames ? (
              <Text style={styles.speakers} numberOfLines={2}>
                {session.speakerNames}
              </Text>
            ) : null}
            {session.description ? (
              <Text style={styles.description} numberOfLines={3}>
                {session.description}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  timelineCol: { width: 16, alignItems: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF7A00',
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#FED7AA',
    marginTop: 4,
    marginBottom: -4,
    minHeight: 36,
  },
  body: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  sessionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  formatRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  formatText: { color: '#EA580C', fontWeight: '600', fontSize: 12 },
  whenText: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  speakers: { color: '#374151', fontSize: 12, marginTop: 4, fontWeight: '600' },
  description: { color: '#6B7280', fontSize: 13, marginTop: 6, lineHeight: 18 },
});
