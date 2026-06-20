import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import apiClient from '@/api/client';
import {
  cancelOrganizerEvent,
  checkInEventAttendee,
  duplicateOrganizerEvent,
  getOrganizerAttendees,
  messageEventAttendees,
  notifyEventPostponed,
} from '@/api/organizer';
import AppPopup from '@/components/common/AppPopup';
import OrganizerStackHeader from '@/features/organizer/components/OrganizerStackHeader';
import TicketQrScanner from '@/features/organizer/components/TicketQrScanner';
import { COLORS } from '@/theme/colors';

function ActionRow({ icon, title, subtitle, onPress, tone = 'default', loading = false }) {
  const iconColor = tone === 'danger' ? '#DC2626' : '#EA580C';
  const bg = tone === 'danger' ? '#FEF2F2' : '#FFF7ED';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        backgroundColor: '#fff',
        marginBottom: 10,
      }}
    >
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        {loading ? <ActivityIndicator size="small" color={iconColor} /> : <Feather name={icon} size={18} color={iconColor} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: tone === 'danger' ? '#B91C1C' : COLORS.textPrimary }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3, lineHeight: 16 }}>{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color="#94A3B8" />
    </Pressable>
  );
}

function StatTile({ label, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
      <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

async function loadAllAttendees(eventId) {
  const rows = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const data = await getOrganizerAttendees({ page, limit: 50, eventId });
    rows.push(...(Array.isArray(data?.items) ? data.items : []));
    hasMore = Boolean(data?.hasMore);
    page += 1;
    if (page > 20) break;
  }
  return rows;
}

export default function OrganizerManageEventScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const eventId = params.eventId != null ? String(params.eventId) : null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [event, setEvent] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [busy, setBusy] = useState('');
  const [popup, setPopup] = useState(null);

  const closePopup = () => setPopup(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    const { data } = await apiClient.get(`/events/${eventId}`);
    setEvent(data);
  }, [eventId]);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    setRefreshing(true);
    try {
      await loadEvent();
    } catch (error) {
      setPopup({ variant: 'error', title: 'Could not refresh', message: error?.message || 'Try again.' });
    } finally {
      setRefreshing(false);
    }
  }, [eventId, loadEvent]);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      setLoading(true);
      try {
        await loadEvent();
      } catch (error) {
        setPopup({ variant: 'error', title: 'Could not load event', message: error?.message || 'Try again.' });
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, loadEvent]);

  const stats = useMemo(
    () => ({
      joins: Number(event?.goingCount ?? event?.attendeesCount ?? 0) || 0,
      saves: Number(event?.saveCount ?? event?.savedCount ?? 0) || 0,
      views: Number(event?.viewCount ?? event?.viewsCount ?? 0) || 0,
    }),
    [event],
  );

  const handleTicketScan = async ({ eventId: scannedEventId, memberId }) => {
    if (!eventId || String(scannedEventId) !== String(eventId)) {
      setPopup({
        variant: 'error',
        title: 'Wrong event',
        message: 'This ticket belongs to a different event.',
      });
      return;
    }

    setScanning(true);
    try {
      const result = await checkInEventAttendee(eventId, memberId);
      setScannerOpen(false);
      setPopup({
        variant: 'success',
        title: result.alreadyCheckedIn ? 'Already checked in' : 'Entry approved',
        message: `${result.memberName || 'Attendee'} can enter.`,
      });
    } catch (error) {
      setPopup({
        variant: 'error',
        title: 'Check-in failed',
        message: error?.message || 'This ticket is not valid for entry.',
      });
    } finally {
      setScanning(false);
    }
  };

  const exportCsv = async () => {
    if (!eventId) return;
    setBusy('export');
    try {
      const rows = await loadAllAttendees(Number(eventId));
      const header = 'Name,Email,Phone,Joined At';
      const lines = rows.map((row) => {
        const cols = [
          row.fullName || '',
          row.email || '',
          row.phone || '',
          row.joinedAt ? new Date(row.joinedAt).toISOString() : '',
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
        return cols.join(',');
      });
      const csv = [header, ...lines].join('\n');
      const path = `${FileSystem.cacheDirectory}event-${eventId}-attendees.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export attendees' });
      } else {
        setPopup({ variant: 'success', title: 'Export ready', message: 'Attendee CSV was saved.' });
      }
    } catch (error) {
      setPopup({ variant: 'error', title: 'Export failed', message: error?.message || 'Could not export CSV.' });
    } finally {
      setBusy('');
    }
  };

  const duplicate = async () => {
    if (!eventId) return;
    setBusy('duplicate');
    try {
      const created = await duplicateOrganizerEvent(eventId);
      setPopup({
        variant: 'success',
        title: 'Event duplicated',
        message: 'A new draft copy is ready to edit.',
        secondaryLabel: 'Done',
        onSecondary: closePopup,
        primaryLabel: 'Open draft',
        onPrimary: () => {
          closePopup();
          router.replace({ pathname: '/(organizer)/edit-event', params: { eventId: String(created.id) } });
        },
      });
    } catch (error) {
      setPopup({ variant: 'error', title: 'Duplicate failed', message: error?.message || 'Could not duplicate event.' });
    } finally {
      setBusy('');
    }
  };

  const runCancel = async () => {
    setBusy('cancel');
    try {
      await cancelOrganizerEvent(eventId);
      await loadEvent();
      setPopup({
        variant: 'success',
        title: 'Event cancelled',
        message: 'Registrants were notified in their inbox.',
      });
    } catch (error) {
      setPopup({ variant: 'error', title: 'Cancel failed', message: error?.message || 'Could not cancel event.' });
    } finally {
      setBusy('');
    }
  };

  const runPostponeNotify = async () => {
    setBusy('postpone');
    try {
      await notifyEventPostponed(eventId, 'The schedule changed. Open the event page for the latest date and time.');
      setPopup({
        variant: 'success',
        title: 'Attendees notified',
        message: 'Registrants received a postponement update in their inbox.',
        primaryLabel: 'Edit schedule',
        onPrimary: () => {
          closePopup();
          router.push({ pathname: '/(organizer)/edit-event', params: { eventId } });
        },
      });
    } catch (error) {
      setPopup({ variant: 'error', title: 'Notify failed', message: error?.message || 'Could not notify attendees.' });
    } finally {
      setBusy('');
    }
  };

  const sendMessage = async () => {
    if (!messageTitle.trim() || !messageBody.trim()) {
      setPopup({ variant: 'warning', title: 'Add a message', message: 'Enter a subject and message before sending.' });
      return;
    }
    setBusy('message');
    try {
      await messageEventAttendees(eventId, {
        title: messageTitle.trim(),
        body: messageBody.trim(),
      });
      setMessageOpen(false);
      setMessageTitle('');
      setMessageBody('');
      setPopup({
        variant: 'success',
        title: 'Message sent',
        message: 'Attendees were notified in their inbox.',
      });
    } catch (error) {
      setPopup({ variant: 'error', title: 'Message failed', message: error?.message || 'Could not send message.' });
    } finally {
      setBusy('');
    }
  };

  if (!eventId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Text>Missing event</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <OrganizerStackHeader title="Manage event" onBack={() => router.back()} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#FF7A00" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FF7A00" />}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }} numberOfLines={2}>
            {event?.title || 'Untitled event'}
          </Text>
          <Text style={{ color: '#64748B', marginTop: 4, marginBottom: 16 }}>
            {event?.status === 'cancelled' ? 'Cancelled' : event?.status === 'published' ? 'Published' : 'Draft'}
          </Text>

          <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 8 }}>EVENT STATS</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            <StatTile label="Joins" value={stats.joins} />
            <StatTile label="Saves" value={stats.saves} />
            <StatTile label="Views" value={stats.views} />
          </View>

          <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 8 }}>DOOR & ATTENDEES</Text>
          <ActionRow
            icon="smartphone"
            title="Check-in / QR scan"
            subtitle="Scan attendee ticket QR codes at the door"
            onPress={() => setScannerOpen(true)}
          />
          <ActionRow
            icon="mail"
            title="Message attendees"
            subtitle='Send updates like “Doors open” or “Room changed”'
            onPress={() => setMessageOpen(true)}
          />
          <ActionRow
            icon="users"
            title="Waitlist"
            subtitle="Auto-fill spots when someone cancels (enable in event editor)"
            onPress={() => router.push({ pathname: '/(organizer)/edit-event', params: { eventId } })}
          />
          <ActionRow
            icon="download"
            title="Export CSV"
            subtitle="Download attendee names, emails, and phone numbers"
            onPress={exportCsv}
            loading={busy === 'export'}
          />

          <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748B', marginTop: 8, marginBottom: 8 }}>EVENT ACTIONS</Text>
          <ActionRow icon="copy" title="Duplicate event" subtitle="Copy last event as a new draft" onPress={duplicate} loading={busy === 'duplicate'} />
          <ActionRow
            icon="calendar"
            title="Postpone event"
            subtitle="Notify registrants and update the schedule"
            onPress={() =>
              setPopup({
                variant: 'warning',
                title: 'Postpone this event?',
                message: 'Registrants will be notified, then you can update the date and time.',
                secondaryLabel: 'Not now',
                onSecondary: closePopup,
                primaryLabel: 'Notify & edit',
                onPrimary: () => {
                  closePopup();
                  runPostponeNotify();
                },
                loading: busy === 'postpone',
              })
            }
          />
          {event?.status !== 'cancelled' ? (
            <ActionRow
              icon="x-circle"
              title="Cancel event"
              subtitle="Notify all registrants"
              tone="danger"
              loading={busy === 'cancel'}
              onPress={() =>
                setPopup({
                  variant: 'warning',
                  title: 'Cancel this event?',
                  message: 'Registrants will be notified and the event will be marked cancelled.',
                  secondaryLabel: 'Keep event',
                  onSecondary: closePopup,
                  primaryLabel: 'Cancel event',
                  onPrimary: () => {
                    closePopup();
                    runCancel();
                  },
                  loading: busy === 'cancel',
                })
              }
            />
          ) : null}
        </ScrollView>
      )}

      <TicketQrScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleTicketScan}
        scanning={scanning}
      />

      <Modal visible={messageOpen} transparent animationType="fade" onRequestClose={() => setMessageOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: '900', marginBottom: 12 }}>Message attendees</Text>
            <TextInput
              value={messageTitle}
              onChangeText={setMessageTitle}
              placeholder="Subject — e.g. Doors open"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 }}
            />
            <TextInput
              value={messageBody}
              onChangeText={setMessageBody}
              placeholder="Message body"
              multiline
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 100, textAlignVertical: 'top' }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable style={{ flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10 }} onPress={() => setMessageOpen(false)}>
                <Text style={{ fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable style={{ flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: '#FF7A00', borderRadius: 10 }} onPress={sendMessage} disabled={busy === 'message'}>
                <Text style={{ fontWeight: '800', color: '#fff' }}>{busy === 'message' ? 'Sending…' : 'Send'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {popup ? (
        <AppPopup
          visible
          variant={popup.variant || 'info'}
          title={popup.title}
          message={popup.message}
          primaryLabel={popup.primaryLabel || 'Done'}
          onPrimary={popup.onPrimary || closePopup}
          secondaryLabel={popup.secondaryLabel}
          onSecondary={popup.onSecondary}
          onClose={closePopup}
          loading={popup.loading}
        />
      ) : null}
    </View>
  );
}
