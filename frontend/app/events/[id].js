import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import * as Location from 'expo-location';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import useAuth from '@/auth/useAuth';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { getEventById, joinEvent, leaveEvent } from '@/api/events';
import { trackEventInteraction } from '@/api/trackEventInteraction';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import EventHeader from '@/components/eventDetail/EventHeader';
import EventDetailIntro from '@/components/eventDetail/EventDetailIntro';
import EventInfo from '@/components/eventDetail/EventInfo';
import EventOrganizerRow from '@/components/eventDetail/EventOrganizerRow';
import EventActions from '@/components/eventDetail/EventActions';
import EventBottomBar from '@/components/eventDetail/EventBottomBar';
import EditAttendanceSheet from '@/components/eventDetail/EditAttendanceSheet';
import EventLineupSections from '@/components/eventDetail/EventLineupSections';
import SpeakerProfileSheet from '@/components/eventDetail/SpeakerProfileSheet';
import { filterRosterByFormat } from '@/utils/eventRosterByFormat';
import EventDirectionsMapModal from '@/components/eventDetail/EventDirectionsMapModal';
import FloatingDirectionsButton from '@/components/eventDetail/FloatingDirectionsButton';
import SponsorCarousel from '@/components/eventDetail/SponsorCarousel';
import SponsorDetailModal from '@/components/eventDetail/SponsorDetailModal';
import { openDirectionsToVenue } from '@/utils/openDirections';
import EventDetailSkeleton from '@/components/skeletons/EventDetailSkeleton';
import { formatAreaLineFromGeocode } from '@/utils/eventLocation';
import { buildEventScheduleLocationFields, formatEventDetailDateTime } from '@/utils/eventDisplay';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

const EventDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const eventId = Array.isArray(id) ? id[0] : id;
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [joined, setJoined] = useState(false);
  const [mapAreaLine, setMapAreaLine] = useState('');
  const [speakerSheet, setSpeakerSheet] = useState({ visible: false, index: 0 });
  const [sponsorSheet, setSponsorSheet] = useState({ visible: false, index: 0 });
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [editAttendanceVisible, setEditAttendanceVisible] = useState(false);
  const { isLoggedIn, user } = useAuth();

  const { savedEventIds, saveEvent, unsaveEvent } = useSavedEvents();
  const isSaved = event ? savedEventIds.includes(String(event.id)) : false;

  useEffect(() => {
    let mounted = true;

    const loadEvent = async () => {
      if (!eventId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const payload = await getEventById(eventId);
        if (!mounted) return;
        setEvent(payload);
        setJoined(Boolean(payload?.isJoined));
        if (isLoggedIn) trackEventInteraction(eventId, 'opened');
      } catch (error) {
        if (!mounted) return;
        setEvent(null);
        const status = error?.response?.status;
        if (status === 404) {
          setLoadError('not_found');
        } else if (!error?.response) {
          setLoadError('network');
        } else {
          setLoadError('unknown');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadEvent();
    return () => {
      mounted = false;
    };
  }, [eventId, isLoggedIn]);

  const locationLatitude = Number(event?.locationLatitude);
  const locationLongitude = Number(event?.locationLongitude);
  const hasExactMapPin = Number.isFinite(locationLatitude) && Number.isFinite(locationLongitude);
  const isOnlineEvent =
    event?.isOnline === true ||
    String(event?.locationName || '')
      .trim()
      .toLowerCase() === 'online';

  useEffect(() => {
    let alive = true;
    setMapAreaLine('');

    if (!event || isOnlineEvent || !hasExactMapPin) {
      return () => {
        alive = false;
      };
    }

    Location.reverseGeocodeAsync({
      latitude: locationLatitude,
      longitude: locationLongitude,
    })
      .then((rows) => {
        if (!alive || !rows?.length) return;
        setMapAreaLine(formatAreaLineFromGeocode(rows[0]));
      })
      .catch(() => {
        if (alive) setMapAreaLine('');
      });

    return () => {
      alive = false;
    };
  }, [event?.id, hasExactMapPin, isOnlineEvent, locationLatitude, locationLongitude]);

  const handleJoinToggle = async () => {
    if (!event) return;
    if (event?.eventState === 'ended') {
      Alert.alert('Event ended', 'This event has already ended.');
      return;
    }
    if (event?.eventState === 'closed') {
      Alert.alert('Registration closed', 'Registration is closed for this event.');
      return;
    }
    if (event?.eventState === 'fully-booked') {
      Alert.alert('Fully booked', 'This event is fully booked. You can join the waitlist and get notified.');
      return;
    }
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }

    try {
      if (joined) {
        await leaveEvent(event.id);
        setJoined(false);
        setEvent((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            isJoined: false,
            joined: false,
            goingCount: Math.max(0, Number(prev.goingCount || 0) - 1),
            attendeePreviews: Array.isArray(prev.attendeePreviews)
              ? prev.attendeePreviews.filter((row) => Number(row?.userId) !== Number(user?.id))
              : [],
          };
        });
      } else {
        await joinEvent(event.id);
        setJoined(true);
        setEvent((prev) => {
          if (!prev) return prev;
          const currentPreviews = Array.isArray(prev.attendeePreviews) ? [...prev.attendeePreviews] : [];
          const currentUserId = Number(user?.id);
          const exists = currentPreviews.some((row) => Number(row?.userId) === currentUserId);
          if (!exists && currentUserId > 0) {
            const rawAvatar = user?.avatarUrl || user?.profileImg || user?.profile_img || null;
            currentPreviews.unshift({
              userId: currentUserId,
              name: user?.fullName || user?.name || 'You',
              avatarUrl: resolveApiAssetUrl(rawAvatar),
            });
          }

          return {
            ...prev,
            isJoined: true,
            joined: true,
            goingCount: Number(prev.goingCount || 0) + 1,
            attendeePreviews: currentPreviews.slice(0, 3),
          };
        });
        router.push(`/events/${event.id}/ticket`);
      }
    } catch {
      Alert.alert('Could not register', 'Please try again in a moment.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <EventDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!event) {
    const errorTitle =
      loadError === 'network'
        ? "Can't reach the server"
        : loadError === 'not_found'
          ? 'Event not found'
          : 'Something went wrong';
    const errorBody =
      loadError === 'network'
        ? 'Make sure the backend is running and your phone is on the same Wi‑Fi as your PC. Check EXPO_PUBLIC_API_BASE_URL in frontend/.env (use your PC LAN IP, not 127.0.0.1), then restart Expo.'
        : loadError === 'not_found'
          ? 'This event may have been removed or the link is invalid.'
          : 'Try again in a moment.';

    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>
            {errorTitle}
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: '#64748B', marginBottom: 20 }}>
            {errorBody}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#FF7B3F',
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const attendees = Array.isArray(event.attendeePreviews) ? event.attendeePreviews : [];
  const sponsors = Array.isArray(event.sponsors)
    ? event.sponsors
        .map((row, index) => ({
          id: row?.id ? String(row.id) : `sponsor-${index}`,
          name:
            typeof row?.name === 'string' && row.name.trim() ? row.name.trim() : 'Sponsor',
          image: row?.logoUrl ? { uri: row.logoUrl } : null,
        }))
        .filter((row) => row.name || row.image)
    : [];
  const displayRoster = filterRosterByFormat(event.roster, event.eventFormat);
  
  const displayPrice =
    event.priceType === 'Paid'
      ? typeof event.priceAmount === 'number'
        ? `$${event.priceAmount}`
        : 'Paid'
      : 'Free';
  const { datePrimary, dateSecondary } = formatEventDetailDateTime(event.startsAt, event.endsAt);

  const scheduleLocation = buildEventScheduleLocationFields({
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    locationName: event.locationName,
    locationAddress: event.locationAddress,
    city: event.city,
    isOnline: isOnlineEvent,
    mapAreaLine,
  });
  const displayLocationPrimary = scheduleLocation.locationPrimary;
  const displayLocationSecondary = scheduleLocation.locationSecondary;

  const preferredLocationQuery = [
    event?.locationName,
    displayLocationSecondary,
    event?.locationAddress,
    event?.city,
  ]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ')
    .trim();
  const mapFallbackQuery = typeof event?.city === 'string' ? event.city.trim() : '';
  const mapQuery = preferredLocationQuery || mapFallbackQuery;
  const showStickyMapButton =
    !isOnlineEvent &&
    (hasExactMapPin || Boolean(mapQuery) || Boolean(displayLocationPrimary));

  const openAttendeesList = () => router.push(`/events/${String(event.id)}/attendees`);

  const startNavigation = async () => {
    await openDirectionsToVenue({
      latitude: hasExactMapPin ? locationLatitude : undefined,
      longitude: hasExactMapPin ? locationLongitude : undefined,
      label: displayLocationPrimary || 'Event venue',
      addressQuery: mapQuery,
    });
  };

  const handleMapPress = () => {
    if ((!mapQuery && !hasExactMapPin) || isOnlineEvent) {
      Alert.alert('Map unavailable', 'This event does not have a physical venue location yet.');
      return;
    }
    if (hasExactMapPin) {
      setMapModalVisible(true);
      return;
    }
    void startNavigation();
  };

  const handleStartNavigationFromModal = async () => {
    setMapModalVisible(false);
    await startNavigation();
  };

  const handleEditAttendanceUpdate = async (stillGoing) => {
    setEditAttendanceVisible(false);
    if (stillGoing) return;
    await handleJoinToggle();
  };

  const openSpeakerSheet = (index) => {
    setSpeakerSheet({ visible: true, index });
  };

  const openSponsorSheet = (index) => {
    setSponsorSheet({ visible: true, index });
  };

  const handleSaveToggle = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }
    if (isSaved) {
      unsaveEvent(event.id);
    } else {
      saveEvent(event.id);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <EventHeader
          event={event}
          isSaved={isSaved}
          onBack={() => router.back()}
          onSave={handleSaveToggle}
        />
        <EventDetailIntro event={event} />
        <View style={[styles.contentContainer, joined && styles.contentContainerJoined]}>
          <EventInfo
            description={event.description}
            datePrimary={datePrimary}
            dateSecondary={dateSecondary}
            locationPrimary={displayLocationPrimary}
            locationSecondary={displayLocationSecondary}
            joined={joined}
            event={event}
          />

          <EventOrganizerRow
            organizerId={event.organizerId}
            name={event.organizerName}
            logoUrl={event.organizerLogoUrl}
            initials={event.organizerInitials}
            verified={event.organizerVerificationStatus === 'approved'}
          />

          <EventLineupSections
            roster={event.roster}
            eventFormat={event.eventFormat}
            onSpeakerPress={(_, index) => openSpeakerSheet(index)}
          />

          {sponsors.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Sponsors</Text>
              <SponsorCarousel logos={sponsors} onLogoPress={openSponsorSheet} />
            </>
          ) : null}

          <EventActions
            attendees={attendees}
            goingCount={event.goingCount}
            capacity={event.capacity}
            eventState={event.eventState}
            onViewAttendees={openAttendeesList}
          />
        </View>
      </ScrollView>

      <EventBottomBar
        joined={joined}
        onRegister={handleJoinToggle}
        onEditAttendance={() => setEditAttendanceVisible(true)}
        onViewTicket={() => router.push(`/events/${eventId}/ticket`)}
        price={displayPrice}
        event={event}
      />

      <FloatingDirectionsButton
        visible={showStickyMapButton}
        onPress={handleMapPress}
        bottomOffset={insets.bottom + 84}
      />

      <EditAttendanceSheet
        visible={editAttendanceVisible}
        isGoing={joined}
        onClose={() => setEditAttendanceVisible(false)}
        onUpdate={handleEditAttendanceUpdate}
      />

      <SpeakerProfileSheet
        visible={speakerSheet.visible}
        roster={displayRoster}
        initialIndex={speakerSheet.index}
        onClose={() => setSpeakerSheet({ visible: false, index: 0 })}
      />

      <SponsorDetailModal
        visible={sponsorSheet.visible}
        sponsors={sponsors}
        initialIndex={sponsorSheet.index}
        onClose={() => setSponsorSheet({ visible: false, index: 0 })}
      />

      {hasExactMapPin ? (
        <EventDirectionsMapModal
          visible={mapModalVisible}
          latitude={locationLatitude}
          longitude={locationLongitude}
          venueLabel={displayLocationPrimary || 'Event venue'}
          addressLine={[displayLocationPrimary, displayLocationSecondary].filter(Boolean).join(' · ')}
          onNavigate={handleStartNavigationFromModal}
          onClose={() => setMapModalVisible(false)}
        />
      ) : null}
    </SafeAreaView>
  );
};

export default EventDetailScreen;

