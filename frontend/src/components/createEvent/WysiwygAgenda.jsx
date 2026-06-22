import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import {
  SESSION_FORMAT_OPTIONS,
  buildSampleAgendaSessions,
} from '@/constants/eventFormats';
import { formatKeyToDisplayLabel } from '@/constants/eventFormatLabels';
import SessionEditModal from '@/components/createEvent/SessionEditModal';

function sessionFormatLabel(key) {
  const found = SESSION_FORMAT_OPTIONS.find((s) => s.key === key);
  return found?.label || formatKeyToDisplayLabel(key);
}

function formatSessionWhen(start, end) {
  if (!(start instanceof Date) || !(end instanceof Date)) return '';
  const day = start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day} · ${startTime} – ${endTime}`;
}

function createEmptySession(eventStart, eventEnd, sortOrder = 0) {
  const start = eventStart instanceof Date ? new Date(eventStart) : new Date();
  const end = eventEnd instanceof Date ? new Date(eventEnd) : new Date(start.getTime() + 60 * 60 * 1000);
  if (end.getTime() <= start.getTime()) {
    end.setHours(start.getHours() + 1);
  }
  return {
    key: `session-${Date.now()}-${sortOrder}`,
    title: '',
    sessionFormat: 'presentation',
    startDatetime: start,
    endDatetime: end,
    description: '',
    speakerNames: '',
    sortOrder,
  };
}

export default function WysiwygAgenda({
  sessions,
  onChangeSessions,
  eventStart,
  eventEnd,
  eventFormat,
  variant = 'create',
}) {
  const isRunSheet = variant === 'runSheet';
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [sessions],
  );

  const openAdd = () => {
    setDraft(createEmptySession(eventStart, eventEnd, sessions.length));
    setModalOpen(true);
  };

  const openEdit = (session) => {
    setDraft({
      ...session,
      startDatetime: session.startDatetime instanceof Date ? session.startDatetime : new Date(session.startDatetime),
      endDatetime: session.endDatetime instanceof Date ? session.endDatetime : new Date(session.endDatetime),
    });
    setModalOpen(true);
  };

  const saveDraft = () => {
    if (!draft?.title?.trim()) {
      Alert.alert('Session title required', 'Give this session a title.');
      return;
    }
    if (!draft?.sessionFormat) {
      Alert.alert('Session format required', 'Choose a session format.');
      return;
    }
    const start = draft.startDatetime instanceof Date ? draft.startDatetime : new Date(draft.startDatetime);
    const end = draft.endDatetime instanceof Date ? draft.endDatetime : new Date(draft.endDatetime);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      Alert.alert('Invalid times', 'Session end must be after the start.');
      return;
    }

    const payload = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description?.trim() || '',
      speakerNames: draft.speakerNames?.trim() || '',
      startDatetime: start,
      endDatetime: end,
    };

    const exists = sessions.some((s) => s.key === draft.key);
    if (exists) {
      onChangeSessions(sessions.map((s) => (s.key === draft.key ? payload : s)));
    } else {
      onChangeSessions([...sessions, { ...payload, sortOrder: sessions.length }]);
    }
    setModalOpen(false);
    setDraft(null);
  };

  const removeSession = (key) => {
    onChangeSessions(sessions.filter((s) => s.key !== key).map((s, i) => ({ ...s, sortOrder: i })));
  };

  const applyTemplate = () => {
    if (sessions.length > 0) {
      Alert.alert('Replace agenda?', 'This will replace your current sessions with a sample agenda.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => onChangeSessions(buildSampleAgendaSessions(eventStart, eventEnd)),
        },
      ]);
      return;
    }
    onChangeSessions(buildSampleAgendaSessions(eventStart, eventEnd));
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[eventStyles.sectionTitle, styles.sectionTitle]}>
          {isRunSheet ? 'Run sheet' : 'Agenda'}
        </Text>
        <Pressable onPress={applyTemplate} style={styles.templateBtn}>
          <Feather name="zap" size={14} color="#EA580C" />
          <Text style={styles.templateText}>Sample agenda</Text>
        </Pressable>
      </View>
      <Text style={styles.helper}>
        {isRunSheet
          ? 'Build the backstage schedule for your MC — session order, timings, and who is on stage.'
          : eventFormat === 'hackathon'
            ? 'Add key blocks like kickoff, hacking time, demos, and awards.'
            : 'Build your program — keynotes, panels, workshops, networking, and more.'}
      </Text>

      {sortedSessions.length === 0 ? (
        <Pressable onPress={openAdd} style={styles.emptyCard}>
          <Feather name="plus-circle" size={22} color="#EA580C" />
          <Text style={styles.emptyTitle}>Add your first session</Text>
          <Text style={styles.emptySub}>Or tap Sample agenda for a quick start</Text>
        </Pressable>
      ) : (
        sortedSessions.map((session, index) => (
          <Pressable key={session.key} onPress={() => openEdit(session)} style={styles.sessionCard}>
            <View style={styles.sessionTop}>
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text style={styles.sessionMeta}>{sessionFormatLabel(session.sessionFormat)}</Text>
                <Text style={styles.sessionWhen}>
                  {formatSessionWhen(
                    session.startDatetime instanceof Date ? session.startDatetime : new Date(session.startDatetime),
                    session.endDatetime instanceof Date ? session.endDatetime : new Date(session.endDatetime),
                  )}
                </Text>
                {session.speakerNames ? (
                  <Text style={styles.sessionSpeakers} numberOfLines={1}>
                    {session.speakerNames}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => removeSession(session.key)}
                hitSlop={8}
                style={styles.removeBtn}
                accessibilityLabel="Remove session"
              >
                <Feather name="trash-2" size={16} color="#9CA3AF" />
              </Pressable>
            </View>
          </Pressable>
        ))
      )}

      {sortedSessions.length > 0 ? (
        <Pressable onPress={openAdd} style={styles.addRow}>
          <Feather name="plus" size={18} color="#EA580C" />
          <Text style={styles.addText}>Add session</Text>
        </Pressable>
      ) : null}

      <SessionEditModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setDraft(null);
        }}
        onSave={saveDraft}
        draft={draft}
        setDraft={setDraft}
        eventStart={eventStart}
        eventEnd={eventEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: { marginTop: 0, marginBottom: 0 },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  templateText: { color: '#EA580C', fontWeight: '700', fontSize: 12 },
  helper: { color: '#6B7280', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  emptyCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FDBA74',
    borderRadius: 14,
    backgroundColor: '#FFFBF5',
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontWeight: '700', color: '#111827' },
  emptySub: { color: '#6B7280', fontSize: 13 },
  sessionCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sessionTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { color: '#EA580C', fontWeight: '700', fontSize: 13 },
  sessionTitle: { fontWeight: '700', color: '#111827', fontSize: 15 },
  sessionMeta: { color: '#EA580C', fontWeight: '600', fontSize: 12, marginTop: 2 },
  sessionWhen: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  sessionSpeakers: { color: '#374151', fontSize: 12, marginTop: 2 },
  removeBtn: { padding: 4 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  addText: { color: '#EA580C', fontWeight: '700' },
});
