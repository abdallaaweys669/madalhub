import React, { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';

import organizerApi from '@/api/organizer';
import OrganizerTabScaffold from '@/features/organizer/components/OrganizerTabScaffold';
import useOrganizerDashboardData from '@/features/organizer/hooks/useOrganizerDashboardData';
import {
  filterOrganizerEventsByTab,
  formatEventMeta,
  formatOrganizerDate,
  organizerEventStatusChip,
  resolveOrganizerEventCoverUrl,
  sortOrganizerEvents,
} from '@/features/organizer/utils/organizerEventUtils';
import { attemptOrganizerPublish } from '@/utils/organizerPublish';
import { useThemeColors } from '@/theme';
import OrganizerDashboardSkeleton from '@/components/skeletons/OrganizerDashboardSkeleton';
import NoEventsIllustration from '@/assets/no events.svg';

const FILTER_TABS = ['All', 'Drafts', 'Published', 'Past'];

export default function OrganizerEventsScreen() {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState('All');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const { events, organizationName, headerFullName, loading, refreshing, onRefresh, refresh } =
    useOrganizerDashboardData();

  const sortedEvents = useMemo(() => sortOrganizerEvents(events), [events]);
  const displayEvents = useMemo(
    () => filterOrganizerEventsByTab(sortedEvents, activeTab),
    [sortedEvents, activeTab],
  );

  const orgLabel = organizationName || headerFullName || 'Organizer';

  const openDeleteModal = useCallback((event) => {
    setDeleteTarget({
      id: event.id,
      title: event.title?.trim() || 'Untitled event',
    });
    setDeleteModalVisible(true);
  }, []);

  const confirmDeleteEvent = useCallback(async () => {
    if (!deleteTarget?.id) return;
    setDeleteSubmitting(true);
    try {
      await organizerApi.deleteEvent(deleteTarget.id);
      await refresh();
      setDeleteModalVisible(false);
      setDeleteTarget(null);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to delete event');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, refresh]);

  if (loading) {
    return (
      <OrganizerTabScaffold title="Events" orgName={orgLabel}>
        <OrganizerDashboardSkeleton />
      </OrganizerTabScaffold>
    );
  }

  return (
    <OrganizerTabScaffold title="Events" orgName={orgLabel}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: isActive ? colors.primary : '#F0F0F2',
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : '#E7E7EA',
                }}
              >
                <Text style={{ color: isActive ? '#fff' : '#6E6E75', fontWeight: '700', fontSize: 13 }}>{tab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {displayEvents.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#101324' }}>No {activeTab.toLowerCase()} events</Text>
            <NoEventsIllustration width={240} height={170} />
          </View>
        ) : (
          displayEvents.map((event) => {
            const chip = organizerEventStatusChip(event);
            const coverUrl = resolveOrganizerEventCoverUrl(event);
            return (
              <View
                key={event.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#EEF2F7',
                  marginBottom: 14,
                  overflow: 'hidden',
                }}
              >
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
                ) : (
                  <View style={{ height: 100, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={28} color={colors.primary} />
                  </View>
                )}
                <View style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ backgroundColor: chip.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                      <Text style={{ color: chip.fg, fontSize: 11, fontWeight: '800' }}>{chip.label}</Text>
                    </View>
                    <Text style={{ color: '#64748B', fontSize: 12 }}>{formatOrganizerDate(event.startsAt)}</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>{formatEventMeta(event)}</Text>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: '/(organizer)/edit-event', params: { eventId: event.id } })
                      }
                      style={{ flex: 1, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>Edit</Text>
                    </Pressable>
                    {event.status === 'published' ? (
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: '/(organizer)/manage-event', params: { eventId: event.id } })
                        }
                        style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontWeight: '700', color: '#EA580C' }}>Manage</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => router.push(`/events/${event.id}`)}
                        style={{ flex: 1, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontWeight: '700', color: '#0F172A' }}>View</Text>
                      </Pressable>
                    )}
                  </View>

                  {event.status === 'published' ? (
                    <Pressable
                      onPress={() => router.push(`/events/${event.id}`)}
                      style={{ marginTop: 8, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>View public page</Text>
                    </Pressable>
                  ) : null}

                  {event.status === 'draft' ? (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <Pressable
                        onPress={async () => {
                          try {
                            const published = await attemptOrganizerPublish(router, async () => {
                              await organizerApi.publishEvent(event.id);
                            });
                            if (published) await refresh();
                          } catch (error) {
                            Alert.alert('Publish failed', error?.message || 'Could not publish event');
                          }
                        }}
                        style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontWeight: '800', color: '#fff' }}>Publish</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => openDeleteModal(event)}
                        style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '900' }}>Delete event?</Text>
            <Text style={{ marginTop: 8, color: '#64748B' }}>{deleteTarget?.title}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Pressable onPress={() => setDeleteModalVisible(false)} style={{ flex: 1, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteEvent}
                disabled={deleteSubmitting}
                style={{ flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 10 }}
              >
                <Text style={{ fontWeight: '800', color: '#B91C1C' }}>{deleteSubmitting ? 'Deleting…' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </OrganizerTabScaffold>
  );
}
