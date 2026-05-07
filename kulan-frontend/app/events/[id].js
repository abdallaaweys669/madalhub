import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import useAuth from '@/auth/useAuth';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { getEventById, joinEvent, leaveEvent } from '@/api/events';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import EventHeader from '@/components/eventDetail/EventHeader';
import EventInfo from '@/components/eventDetail/EventInfo';
import EventActions from '@/components/eventDetail/EventActions';
import EventBottomBar from '@/components/eventDetail/EventBottomBar';
import EventRoster from '@/components/eventDetail/EventRoster';
import SponsorCarousel from '@/components/eventDetail/SponsorCarousel';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

const EventDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const eventId = Array.isArray(id) ? id[0] : id;
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joined, setJoined] = useState(false);
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
      try {
        const payload = await getEventById(eventId);
        if (!mounted) return;
        setEvent(payload);
        setJoined(Boolean(payload?.isJoined));
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
  }, [eventId]);

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
      }
    } catch {
      // Keep current state on request error.
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading event...</Text>
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
          image: row?.logoUrl ? { uri: row.logoUrl } : null,
        }))
        .filter((row) => row.image)
    : [];
  
  let datePrimary = '';
  let dateSecondary = '';
  let locationPrimary = '';
  let locationSecondary = '';
  const displayPrice =
    event.priceType === 'Paid'
      ? typeof event.priceAmount === 'number'
        ? `$${event.priceAmount}`
        : 'Paid'
      : 'Free';
  if (event.details) {
    const parts = event.details.split('·').map((item) => item.trim());
    const dateRaw = parts[0] || '';
    const locationRaw = parts[1] || '';
    const datePieces = dateRaw.split(',').map((item) => item.trim());
    datePrimary = datePieces[0] ? `${datePieces[0]}, ${datePieces[1] ?? ''}`.trim() : dateRaw;
    dateSecondary = datePieces[2] || '7:00PM-10:00PM';
    locationPrimary = locationRaw || '';
    locationSecondary = locationRaw?.toLowerCase() === 'online' ? 'Online' : '';
  }

  const isOnlineEvent = String(locationPrimary || event?.locationName || '')
    .trim()
    .toLowerCase() === 'online';
  const preferredLocationQuery = [
    event?.locationAddress,
    event?.locationName,
    locationPrimary,
    event?.city,
    locationSecondary,
  ]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ')
    .trim();
  const mapFallbackQuery = typeof event?.city === 'string' ? event.city.trim() : '';
  const mapQuery = preferredLocationQuery || mapFallbackQuery;
  const showStickyMapButton = !isOnlineEvent && Boolean(mapQuery);

  const openAttendeesList = () => router.push(`/events/${String(event.id)}/attendees`);
  const handleMapPress = async () => {
    if (!mapQuery || isOnlineEvent) {
      Alert.alert('Map unavailable', 'This event does not have a physical venue location yet.');
      return;
    }

    const encoded = encodeURIComponent(mapQuery);
    const nativeScheme =
      Platform.OS === 'ios' ? `maps:0,0?q=${encoded}` : `geo:0,0?q=${encoded}`;
    const webFallback = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

    try {
      const canOpenNative = await Linking.canOpenURL(nativeScheme);
      if (canOpenNative) {
        await Linking.openURL(nativeScheme);
        return;
      }
      await Linking.openURL(webFallback);
    } catch {
      Alert.alert('Unable to open map', 'Please try again in a moment.');
    }
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <EventHeader 
          event={event}
          isSaved={isSaved}
          onBack={() => router.back()}
          onSave={handleSaveToggle}
        />
        <View style={styles.contentContainer}>
          <EventInfo
            title={event.title}
            description={event.description}
            datePrimary={datePrimary}
            dateSecondary={dateSecondary}
            locationPrimary={locationPrimary || event?.locationName || 'Venue TBA'}
            locationSecondary={locationSecondary || event?.city || 'Location details not provided'}
          />

          <Text style={styles.sectionTitle}>Organized by</Text>
          <View style={styles.organizationCard}>
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
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={11} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.organizationCategory}>{organizerDescription}</Text>
            </View>
          </View>

          {event?.roster?.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Speakers & Guests</Text>
              <EventRoster roster={event.roster} />
            </>
          ) : null}

          {sponsors.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Sponsors</Text>
              <SponsorCarousel logos={sponsors} />
            </>
          ) : null}

          <EventActions
            attendees={attendees}
            goingCount={event.goingCount}
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
            <Text style={styles.mapText}>View on Map</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <EventBottomBar
        joined={joined}
        onToggleJoin={handleJoinToggle}
        price={displayPrice}
        event={event}
      />
    </SafeAreaView>
  );
};

export default EventDetailScreen;

