import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useLocalSearchParams } from 'expo-router';

import organizerApi from '@/api/organizer';
import { getEventInterests, patchOrganizerEvent } from '@/api/events';
import OrganizerTabScaffold from '@/features/organizer/components/OrganizerTabScaffold';
import OrganizerEventsChipTabs from '@/features/organizer/components/OrganizerEventsChipTabs';
import OrganizerEventsSearchBar from '@/features/organizer/components/OrganizerEventsSearchBar';
import OrganizerEventsFilterSheet from '@/features/organizer/components/OrganizerEventsFilterSheet';
import OrganizerEventListCard from '@/features/organizer/components/OrganizerEventListCard';
import OrganizerEventMenuSheet from '@/features/organizer/components/OrganizerEventMenuSheet';
import useOrganizerDashboardData from '@/features/organizer/hooks/useOrganizerDashboardData';
import {
  applyOrganizerEventFilters,
  countActiveEventFilters,
  EMPTY_EVENT_FILTERS,
  EVENT_LIST_TABS,
} from '@/features/organizer/utils/organizerEventsFilters';
import {
  filterOrganizerEventsByTab,
  sortOrganizerEvents,
} from '@/features/organizer/utils/organizerEventUtils';
import { attemptOrganizerPublish } from '@/utils/organizerPublish';
import { useThemeColors } from '@/theme';
import OrganizerDashboardSkeleton from '@/components/skeletons/OrganizerDashboardSkeleton';
import NoEventsIllustration from '@/assets/no events.svg';

export default function OrganizerEventsScreen() {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { filter } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState('Published');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilters, setEventFilters] = useState(EMPTY_EVENT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [categories, setCategories] = useState([]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTarget, setMenuTarget] = useState(null);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const { events, organizationName, headerFullName, loading, refreshing, onRefresh, refresh } =
    useOrganizerDashboardData();

  useEffect(() => {
    const nextFilter = Array.isArray(filter) ? filter[0] : filter;
    if (nextFilter && EVENT_LIST_TABS.includes(nextFilter)) {
      setActiveTab(nextFilter);
    }
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getEventInterests();
        if (!cancelled) {
          setCategories(Array.isArray(list) ? list.map((row) => ({ id: row.id, name: row.name })) : []);
        }
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedEvents = useMemo(() => sortOrganizerEvents(events), [events]);
  const tabEvents = useMemo(
    () => filterOrganizerEventsByTab(sortedEvents, activeTab),
    [sortedEvents, activeTab],
  );
  const displayEvents = useMemo(
    () => applyOrganizerEventFilters(tabEvents, eventFilters, searchQuery),
    [tabEvents, eventFilters, searchQuery],
  );

  const activeFilterCount = countActiveEventFilters(eventFilters);
  const orgLabel = organizationName || headerFullName || 'Organizer';

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setMenuTarget(null);
  }, []);

  const openMenu = useCallback((event) => {
    setMenuTarget(event);
    setMenuVisible(true);
  }, []);

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

  const handleShare = useCallback(async (event) => {
    try {
      await Share.share({
        message: `${event.title?.trim() || 'Event'}\nOpen in MadalHub to view details.`,
      });
    } catch {
      // User dismissed share sheet.
    }
  }, []);

  const handleDuplicate = useCallback(
    async (event) => {
      setActionBusy(true);
      try {
        const created = await organizerApi.duplicateOrganizerEvent(event.id);
        await refresh();
        Alert.alert('Duplicated', 'A draft copy is ready to edit.', [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Open draft',
            onPress: () =>
              router.push({ pathname: '/(organizer)/edit-event', params: { eventId: String(created.id) } }),
          },
        ]);
      } catch (error) {
        Alert.alert('Duplicate failed', error?.message || 'Could not duplicate event');
      } finally {
        setActionBusy(false);
      }
    },
    [refresh, router],
  );

  const handleArchive = useCallback(
    (event) => {
      const title = event.title?.trim() || 'Untitled event';
      const archivePublished = async () => {
        setActionBusy(true);
        try {
          await organizerApi.cancelOrganizerEvent(event.id);
          await refresh();
          Alert.alert('Archived', 'The event was archived and registrants were notified.');
        } catch (error) {
          Alert.alert('Archive failed', error?.message || 'Could not archive event');
        } finally {
          setActionBusy(false);
        }
      };

      const archiveDraft = async () => {
        setActionBusy(true);
        try {
          await patchOrganizerEvent(event.id, { status: 'cancelled' });
          await refresh();
          Alert.alert('Archived', 'The draft was moved to archived.');
        } catch (error) {
          Alert.alert('Archive failed', error?.message || 'Could not archive event');
        } finally {
          setActionBusy(false);
        }
      };

      Alert.alert(
        'Archive event?',
        event.status === 'published'
          ? `"${title}" will be archived and registrants will be notified.`
          : `"${title}" will be moved to archived.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive',
            style: 'destructive',
            onPress: event.status === 'published' ? archivePublished : archiveDraft,
          },
        ],
      );
    },
    [refresh],
  );

  const handleUnarchive = useCallback(
    (event) => {
      const title = event.title?.trim() || 'Untitled event';
      Alert.alert(
        'Unarchive event?',
        `"${title}" will be restored as a draft. Publish again when you are ready.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unarchive',
            onPress: async () => {
              setActionBusy(true);
              try {
                await patchOrganizerEvent(event.id, { status: 'draft' });
                await refresh();
                Alert.alert('Unarchived', 'Event restored as a draft.');
              } catch (error) {
                Alert.alert('Unarchive failed', error?.message || 'Could not unarchive event');
              } finally {
                setActionBusy(false);
              }
            },
          },
        ],
      );
    },
    [refresh],
  );

  const handleMenuSelect = useCallback(
    async (action) => {
      const event = menuTarget;
      closeMenu();
      if (!event || actionBusy) return;

      if (action === 'duplicate') {
        await handleDuplicate(event);
        return;
      }
      if (action === 'share') {
        await handleShare(event);
        return;
      }
      if (action === 'unarchive') {
        handleUnarchive(event);
        return;
      }
      if (action === 'archive') {
        handleArchive(event);
        return;
      }
      if (action === 'delete') {
        openDeleteModal(event);
      }
    },
    [
      actionBusy,
      closeMenu,
      handleArchive,
      handleDuplicate,
      handleShare,
      handleUnarchive,
      menuTarget,
      openDeleteModal,
    ],
  );

  const handlePublish = useCallback(
    async (event) => {
      try {
        const published = await attemptOrganizerPublish(
          router,
          async () => {
            await organizerApi.publishEvent(event.id);
          },
          { eventId: event.id, eventTitle: event.title },
        );
        if (published) await refresh();
      } catch (error) {
        Alert.alert('Publish failed', error?.message || 'Could not publish event');
      }
    },
    [refresh, router],
  );

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
        contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
      >
        <OrganizerEventsChipTabs activeTab={activeTab} onChange={setActiveTab} />

        <OrganizerEventsSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          activeFilterCount={activeFilterCount}
          onFilterPress={() => setFilterSheetVisible(true)}
        />

        {displayEvents.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#101324', marginBottom: 8 }}>
              {activeTab === 'All'
                ? 'No events yet'
                : activeTab === 'Archived'
                  ? 'No archived events'
                  : `No ${activeTab.toLowerCase()} events`}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', textAlign: 'center', marginBottom: 12 }}>
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters.'
                : 'Create an event to get started.'}
            </Text>
            <NoEventsIllustration width={240} height={170} />
          </View>
        ) : (
          displayEvents.map((event) => (
            <OrganizerEventListCard
              key={event.id}
              event={event}
              onEdit={() =>
                router.push({ pathname: '/(organizer)/edit-event', params: { eventId: event.id } })
              }
              onManage={() =>
                router.push({ pathname: '/(organizer)/manage-event', params: { eventId: event.id } })
              }
              onPreview={() => router.push(`/events/${event.id}`)}
              onPublish={() => handlePublish(event)}
              onUnarchive={() => handleUnarchive(event)}
              onMenuPress={() => openMenu(event)}
            />
          ))
        )}
      </ScrollView>

      <OrganizerEventsFilterSheet
        visible={filterSheetVisible}
        value={eventFilters}
        categories={categories}
        onChange={setEventFilters}
        onClose={() => setFilterSheetVisible(false)}
        onReset={() => setEventFilters(EMPTY_EVENT_FILTERS)}
      />

      <OrganizerEventMenuSheet
        visible={menuVisible}
        eventTitle={menuTarget?.title}
        isArchived={menuTarget?.status === 'cancelled'}
        onClose={closeMenu}
        onSelect={handleMenuSelect}
      />

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '900' }}>Delete event?</Text>
            <Text style={{ marginTop: 8, color: '#64748B' }}>{deleteTarget?.title}</Text>
            <Text style={{ marginTop: 8, color: '#94A3B8', fontSize: 13 }}>
              This permanently removes the event and cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Pressable onPress={() => setDeleteModalVisible(false)} style={{ flex: 1, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteEvent}
                disabled={deleteSubmitting}
                style={{ flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 10 }}
              >
                <Text style={{ fontWeight: '800', color: '#B91C1C' }}>
                  {deleteSubmitting ? 'Deleting…' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </OrganizerTabScaffold>
  );
}
