import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import apiClient from '@/api/client';
import { patchOrganizerEvent } from '@/api/events';
import WysiwygAgenda from '@/components/createEvent/WysiwygAgenda';
import OrganizerStackHeader from '@/features/organizer/components/OrganizerStackHeader';
import { formatEventDateLabel, formatEventTimeLabel } from '@/utils/formatEventSchedule';

function mapLoadedSessions(rawSessions) {
  if (!Array.isArray(rawSessions)) return [];
  return rawSessions.map((s, i) => ({
    key: `s-${s.id ?? i}`,
    title: s.title || '',
    sessionFormat: s.sessionFormat || 'presentation',
    startDatetime: new Date(s.startDatetime ?? s.startsAt),
    endDatetime: new Date(s.endDatetime ?? s.endsAt),
    description: s.description || '',
    speakerNames: s.speakerNames || '',
    sortOrder: s.sortOrder ?? i,
  }));
}

function sessionsToPayload(sessions) {
  return sessions
    .filter((s) => s.title?.trim())
    .map((s, idx) => ({
      title: s.title.trim(),
      sessionFormat: s.sessionFormat || 'presentation',
      startDatetime: (s.startDatetime instanceof Date ? s.startDatetime : new Date(s.startDatetime)).toISOString(),
      endDatetime: (s.endDatetime instanceof Date ? s.endDatetime : new Date(s.endDatetime)).toISOString(),
      description: s.description?.trim() || null,
      speakerNames: s.speakerNames?.trim() || null,
      sortOrder: idx,
    }));
}

export default function OrganizerManageAgendaScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const eventId = params.eventId != null ? String(params.eventId) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);

  const eventStart = useMemo(() => {
    const raw = event?.startsAt ?? event?.datetime?.start;
    const d = raw ? new Date(raw) : null;
    return d && Number.isFinite(d.getTime()) ? d : null;
  }, [event]);

  const eventEnd = useMemo(() => {
    const raw = event?.endsAt ?? event?.datetime?.end;
    const d = raw ? new Date(raw) : null;
    return d && Number.isFinite(d.getTime()) ? d : null;
  }, [event]);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    const { data } = await apiClient.get(`/events/${eventId}`);
    setEvent(data);
    setSessions(mapLoadedSessions(data.sessions));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      setLoading(true);
      try {
        await loadEvent();
      } catch (error) {
        Alert.alert('Could not load run sheet', error?.message || 'Try again.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, loadEvent, router]);

  const onSave = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      await patchOrganizerEvent(eventId, { sessions: sessionsToPayload(sessions) });
      Alert.alert('Saved', 'Your private run sheet is updated.');
    } catch (error) {
      Alert.alert('Save failed', error?.message || 'Could not save run sheet.');
    } finally {
      setSaving(false);
    }
  };

  if (!eventId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Missing event</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <OrganizerStackHeader title="Run sheet" onBack={() => router.back()} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#FF7A00" />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                backgroundColor: '#FFF7ED',
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#FDBA74',
              }}
            >
              <Text style={{ fontWeight: '800', color: '#9A3412', fontSize: 13 }}>Private — organizer only</Text>
              <Text style={{ color: '#7C2D12', fontSize: 12, marginTop: 4, lineHeight: 17 }}>
                MC and backstage timing. Attendees do not see this run sheet on the event page.
              </Text>
            </View>

            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 }} numberOfLines={2}>
              {event?.title || 'Event'}
            </Text>
            {eventStart && eventEnd ? (
              <Text style={{ color: '#64748B', marginBottom: 4, fontSize: 13 }}>
                {formatEventDateLabel(eventStart, eventEnd)} · {formatEventTimeLabel(eventStart, eventEnd)}
              </Text>
            ) : null}

            <WysiwygAgenda
              sessions={sessions}
              onChangeSessions={setSessions}
              eventStart={eventStart}
              eventEnd={eventEnd}
              eventFormat={event?.eventFormat}
              variant="runSheet"
            />
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: insets.bottom + 12,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={{
                backgroundColor: '#FF7A00',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                {saving ? 'Saving…' : 'Save run sheet'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
