import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import useAuth from '@/auth/useAuth';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { getEventById, joinEvent, leaveEvent } from '@/api/events';
import { trackEventInteraction } from '@/api/trackEventInteraction';
import organizerApi from '@/api/organizer';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import EventHeader from '@/components/eventDetail/EventHeader';
import EventDetailIntro from '@/components/eventDetail/EventDetailIntro';
import EventInfo from '@/components/eventDetail/EventInfo';
import EventActions from '@/components/eventDetail/EventActions';
import EventBottomBar from '@/components/eventDetail/EventBottomBar';
import EditAttendanceSheet from '@/components/eventDetail/EditAttendanceSheet';
import EventRoster from '@/components/eventDetail/EventRoster';
import EventDirectionsMapModal from '@/components/eventDetail/EventDirectionsMapModal';
import SponsorCarousel from '@/components/eventDetail/SponsorCarousel';
import { openDirectionsToVenue } from '@/utils/openDirections';
import EventDetailSkeleton from '@/components/skeletons/EventDetailSkeleton';
import ImageGalleryModal from '@/components/common/ImageGalleryModal';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import { formatAreaLineFromGeocode } from '@/utils/eventLocation';
import { buildEventScheduleLocationFields, formatEventDetailDateTime } from '@/utils/eventDisplay';
import VerificationBadgeWhite from '@/assets/verification badge white mode.svg';

const EventDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const eventId = Array.isArray(id) ? id[0] : id;
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [organizerVerifiedBadge, setOrganizerVerifiedBadge] = useState(false);
  const [organizerFollowing, setOrganizerFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [mapAreaLine, setMapAreaLine] = useState('');
  const [gallery, setGallery] = useState({ visible: false, items: [], index: 0 });
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [editAttendanceVisible, setEditAttendanceVisible] = useState(false);
  const { isLoggedIn, isMember, userRole, user } = useAuth();

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
      try {
        const payload = await getEventById(eventId);
        if (!mounted) return;
        setEvent(payload);
        setJoined(Boolean(payload?.isJoined));
        if (isLoggedIn) trackEventInteraction(eventId, 'opened');
      } catch {
        if (!mounted) return;
        setEvent(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadEvent();
    return () => {
      mounted = false;
    };
  }, [eventId, isLoggedIn]);

  useEffect(() => {
    if (!event?.organizerId) {
      setOrganizerVerifiedBadge(false);
      setOrganizerFollowing(false);
      return;
    }
    const organizerIdNum = Number(event.organizerId);
    if (!Number.isFinite(organizerIdNum) || organizerIdNum <= 0) {
      setOrganizerVerifiedBadge(false);
      return;
    }
    let alive = true;
    organizerApi
      .getPublicOrganizerProfile(organizerIdNum)
      .then((profile) => {
        if (!alive) return;
        setOrganizerVerifiedBadge(profile?.verificationStatus === 'approved');
        setOrganizerFollowing(Boolean(profile?.isFollowing));
      })
      .catch(() => {
        if (!alive) {
          setOrganizerVerifiedBadge(false);
          setOrganizerFollowing(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [event?.id, event?.organizerId]);

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
        router.push(`/events/${event.id}/going`);
      }
    } catch {
      // Keep current state on request error.
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
    return (
      <SafeAreaView style={styles.container}>
        <Text>Event not found!</Text>
      </SafeAreaView>
    );
  }
  const attendees = Array.isArray(event.attendeePreviews) ? event.attendeePreviews : [];
  const organizerName = event.organizerName || 'Organizer';
  const organizerDescription = event.organizerDescription || 'Organization profile';
  const organizerInitials = String(event.organizerInitials || organizerName).slice(0, 2).toUpperCase();
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
  const showStickyMapButton = !isOnlineEvent && (hasExactMapPin || Boolean(mapQuery));

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
  const handleFollowOrganizer = async () => {
    if (!event?.organizerId) return;
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }
    if (userRole !== 1 || !isMember) {
      Alert.alert('Members only', 'Switch to a member account to follow organizers.');
      return;
    }
    setFollowBusy(true);
    try {
      if (organizerFollowing) {
        await organizerApi.unfollowOrganizer(Number(event.organizerId));
        setOrganizerFollowing(false);
      } else {
        await organizerApi.followOrganizer(Number(event.organizerId));
        setOrganizerFollowing(true);
      }
    } catch (e) {
      Alert.alert('Could not update', e?.message || 'Try again.');
    } finally {
      setFollowBusy(false);
    }
  };

  const openRosterGallery = (index) => {
    const roster = Array.isArray(event?.roster) ? event.roster : [];
    setGallery({
      visible: true,
      index,
      items: roster.map((person, idx) => {
        const photoUri = resolveApiAssetUrl(person.photoUrl);
        return {
          id: String(person.id ?? `${person.displayName}-${idx}`),
          kind: 'person',
          seedName: person.displayName,
          image: photoUri ? { uri: photoUri } : null,
          title: person.displayName,
          subtitle: person.title?.trim() || '',
        };
      }),
    });
  };

  const openSponsorGallery = (index) => {
    setGallery({
      visible: true,
      index,
      items: sponsors.map((row) => ({
        id: row.id,
        kind: 'sponsor',
        image: row.image,
        title: row.name,
        subtitle: '',
      })),
    });
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
        <View style={styles.contentContainer}>
          <EventInfo
            description={event.description}
            datePrimary={datePrimary}
            dateSecondary={dateSecondary}
            locationPrimary={displayLocationPrimary}
            locationSecondary={displayLocationSecondary}
          />

          <Text style={styles.sectionTitle}>Organized by</Text>
          <View style={[styles.organizationCard, !event.organizerId ? { opacity: 0.7 } : null]}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!event.organizerId}
              onPress={() => {
                if (event.organizerId) {
                  router.push(`/organizer/${event.organizerId}`);
                }
              }}
              style={styles.organizationCardMain}
            >
              {event.organizerLogoUrl ? (
                <Image source={{ uri: event.organizerLogoUrl }} style={styles.organizationLogo} />
              ) : (
                <View style={[styles.organizationLogo, styles.organizationLogoFallback]}>
                  <Text style={styles.organizationLogoFallbackText}>{organizerInitials}</Text>
                </View>
              )}
              <View style={styles.organizationTextWrap}>
                <View style={styles.organizationNameRow}>
                  <Text style={styles.organizationName}>{organizerName}</Text>
                  {organizerVerifiedBadge ? (
                    <VerificationBadgeWhite width={18} height={18} style={{ marginLeft: 4 }} />
                  ) : null}
                </View>
                <Text style={styles.organizationCategory}>{organizerDescription}</Text>
              </View>
            </TouchableOpacity>
            {event.organizerId ? (
              <TouchableOpacity
                style={[
                  styles.organizerFollowBtn,
                  organizerFollowing ? styles.organizerFollowBtnActive : null,
                ]}
                onPress={handleFollowOrganizer}
                disabled={followBusy}
                activeOpacity={0.88}
              >
                <Text
                  style={[
                    styles.organizerFollowBtnText,
                    organizerFollowing ? styles.organizerFollowBtnTextActive : null,
                  ]}
                >
                  {organizerFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {event?.roster?.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Speakers & Guests</Text>
              <EventRoster roster={event.roster} onPersonPress={(_, index) => openRosterGallery(index)} />
            </>
          ) : null}

          {sponsors.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Sponsors</Text>
              <SponsorCarousel logos={sponsors} onLogoPress={openSponsorGallery} />
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

      <View
        pointerEvents={showStickyMapButton ? 'auto' : 'none'}
        style={[
          styles.stickyMapButtonWrap,
          {
            bottom: insets.bottom + 84,
          },
        ]}
      >
        {showStickyMapButton ? (
          <TouchableOpacity style={styles.mapButton} onPress={handleMapPress}>
            <Feather name="map" size={16} color="#FF7A00" />
            <Text style={styles.mapText}>Get Directions</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <EventBottomBar
        joined={joined}
        onRegister={handleJoinToggle}
        onEditAttendance={() => setEditAttendanceVisible(true)}
        price={displayPrice}
        event={event}
      />

      <EditAttendanceSheet
        visible={editAttendanceVisible}
        isGoing={joined}
        onClose={() => setEditAttendanceVisible(false)}
        onUpdate={handleEditAttendanceUpdate}
      />

      <ImageGalleryModal
        visible={gallery.visible}
        items={gallery.items}
        initialIndex={gallery.index}
        onClose={() => setGallery({ visible: false, items: [], index: 0 })}
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

