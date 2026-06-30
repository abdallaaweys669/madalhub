import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatAreaLineFromGeocode } from '@/utils/eventLocation';

const MOGADISHU_REGION = {
  latitude: 2.0469,
  longitude: 45.3182,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const SOMALIA_BOUNDS = {
  minLatitude: -1.7,
  maxLatitude: 12.2,
  minLongitude: 40.9,
  maxLongitude: 51.5,
};

const isCoordinateInSomalia = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= SOMALIA_BOUNDS.minLatitude &&
  latitude <= SOMALIA_BOUNDS.maxLatitude &&
  longitude >= SOMALIA_BOUNDS.minLongitude &&
  longitude <= SOMALIA_BOUNDS.maxLongitude;

const INSTITUTION_KEYWORDS = [
  'university',
  'college',
  'school',
  'hospital',
  'institute',
  'campus',
  'branch',
];

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
const SUGGESTIONS_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.42);
const NEARBY_SEARCH_RADIUS_M = 50000;
const MAX_SUGGESTIONS = 15;

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceMeters(meters) {
  if (!Number.isFinite(meters)) return '';
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function attachDistanceAndSort(places, origin) {
  if (!origin) return places;
  return places
    .map((place) => {
      if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
        return place;
      }
      return {
        ...place,
        distanceMeters: haversineMeters(
          origin.latitude,
          origin.longitude,
          place.latitude,
          place.longitude,
        ),
      };
    })
    .sort((a, b) => {
      const aHasCoords = Number.isFinite(a.latitude);
      const bHasCoords = Number.isFinite(b.latitude);
      if (aHasCoords !== bHasCoords) return aHasCoords ? -1 : 1;
      return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
    });
}

export default function LocationPickerModal({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
  areaMode = false,
}) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [markerCoord, setMarkerCoord] = useState(null);
  const [region, setRegion] = useState(MOGADISHU_REGION);

  const [addressDetails, setAddressDetails] = useState({
    name: '',
    address: '',
  });
  const [nearbySuggestion, setNearbySuggestion] = useState(null);
  const [nearbyPromptVisible, setNearbyPromptVisible] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState(null);

  const looksLikePlusCode = (value = '') => {
    const v = String(value || '').trim();
    return /^[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,8}$/i.test(v);
  };

  const normalizeSearchText = (value = '') =>
    String(value || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const hasInstitutionKeyword = (query) => {
    const normalized = normalizeSearchText(query);
    return INSTITUTION_KEYWORDS.some((word) => normalized.includes(word));
  };

  const buildSuggestionQueries = (query) => {
    const clean = query.trim().replace(/\s+/g, ' ');
    if (!clean) return [];

    const normalized = normalizeSearchText(clean);
    const tokens = normalized.split(' ').filter(Boolean);
    const coreTokens = tokens.filter((token) => !INSTITUTION_KEYWORDS.includes(token));
    const core = coreTokens.join(' ');
    const variants = [clean, `${clean} Mogadishu`, `${clean} Somalia`];

    if (core && hasInstitutionKeyword(clean)) {
      variants.push(core, `${core} Mogadishu`, `${core} campus`, `${core} branch`);
    }

    return [...new Set(variants.filter((item) => item.trim().length >= 2))];
  };

  const isRelevantPlace = (place, query) => {
    const haystack = normalizeSearchText(`${place?.name || ''} ${place?.address || ''}`);
    const tokens = normalizeSearchText(query)
      .split(' ')
      .filter((token) => token.length >= 2 && !INSTITUTION_KEYWORDS.includes(token));
    if (tokens.length === 0) return true;
    return tokens.some((token) => haystack.includes(token));
  };

  const parseSearchResult = (item) => {
    const displayName = String(item?.display_name || '').trim();
    const firstDisplayPart = displayName.split(',')[0]?.trim();
    const name = String(item?.name || firstDisplayPart || 'Selected venue').trim();
    const address = displayName.startsWith(name)
      ? displayName.slice(name.length).replace(/^,\s*/, '').trim()
      : displayName;
    const latitude = Number(item?.lat);
    const longitude = Number(item?.lon);

    if (!isCoordinateInSomalia(latitude, longitude)) return null;
    return {
      id: String(item?.place_id ?? `${latitude},${longitude}`),
      name,
      address,
      latitude,
      longitude,
    };
  };

  const parseGooglePrediction = (prediction) => {
    const description = String(prediction?.description || '').trim();
    const mainText = String(prediction?.structured_formatting?.main_text || '').trim();
    const secondaryText = String(prediction?.structured_formatting?.secondary_text || '').trim();
    const placeId = String(prediction?.place_id || '').trim();
    const name = mainText || description.split(',')[0]?.trim() || 'Selected venue';

    if (!placeId || !name || !description) return null;
    return {
      id: `google-${placeId}`,
      source: 'google',
      placeId,
      name,
      address: secondaryText || description.replace(name, '').replace(/^,\s*/, '').trim(),
      latitude: null,
      longitude: null,
    };
  };

  const parseGooglePlaceResult = (item) => {
    const latitude = Number(item?.geometry?.location?.lat);
    const longitude = Number(item?.geometry?.location?.lng);
    const placeId = String(item?.place_id || '').trim();
    const name = String(item?.name || '').trim();
    if (!placeId || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    if (!isCoordinateInSomalia(latitude, longitude)) return null;
    return {
      id: `google-place-${placeId}`,
      source: 'google',
      placeId,
      name,
      address: String(item?.formatted_address || item?.vicinity || '').trim(),
      latitude,
      longitude,
    };
  };

  const getSearchBiasOrigin = () =>
    searchOrigin ||
    (nearbySuggestion
      ? { latitude: nearbySuggestion.latitude, longitude: nearbySuggestion.longitude }
      : null);

  const parsePhotonResult = (feature) => {
    const coordinates = Array.isArray(feature?.geometry?.coordinates)
      ? feature.geometry.coordinates
      : [];
    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);
    if (!isCoordinateInSomalia(latitude, longitude)) return null;

    const props = feature?.properties || {};
    const name = String(props.name || props.street || props.city || 'Selected venue').trim();
    const address = [
      props.street,
      props.district,
      props.city,
      props.state,
      props.country,
    ]
      .filter((part) => typeof part === 'string' && part.trim() && part.trim() !== name)
      .join(', ');

    if (!name || name === 'Selected venue') return null;
    return {
      id: String(props.osm_id ?? `${latitude},${longitude}`),
      name,
      address,
      latitude,
      longitude,
    };
  };

  const parseGeocodeResult = (query, item, index) => {
    const latitude = Number(item?.latitude);
    const longitude = Number(item?.longitude);
    if (!isCoordinateInSomalia(latitude, longitude)) return null;

    return {
      id: `geocode-${index}-${latitude},${longitude}`,
      name: query.trim().replace(/\s+/g, ' '),
      address: '',
      latitude,
      longitude,
    };
  };

  const formatReverseAddress = (place) => formatAreaLineFromGeocode(place);

  const dedupePlaces = (places) => {
    const seen = new Set();
    return places.filter((place) => {
      if (place.placeId) {
        const key = `pid:${place.placeId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }
      const addressKey = String(place.address || '').toLowerCase();
      const key = addressKey
        ? `${place.name.toLowerCase()}-${addressKey}`
        : Number.isFinite(place.latitude)
          ? `${place.name.toLowerCase()}-${place.latitude.toFixed(4)}-${place.longitude.toFixed(4)}`
          : `${place.name.toLowerCase()}-${place.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const fetchGooglePlaceSearch = async (endpoint, params) => {
    if (!GOOGLE_PLACES_API_KEY) return [];

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/${endpoint}/json?${params.toString()}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!response.ok) {
      throw new Error(`Google ${endpoint} failed: ${response.status}`);
    }

    const payload = await response.json();
    if (payload?.status && !['OK', 'ZERO_RESULTS'].includes(payload.status)) {
      console.warn(`Google ${endpoint} status:`, payload.status, payload?.error_message);
      return [];
    }

    const rows = Array.isArray(payload?.results) ? payload.results : [];
    return rows.map(parseGooglePlaceResult).filter(Boolean);
  };

  const fetchGoogleNearbySearch = async (query, origin) => {
    if (!origin) return [];

    const params = new URLSearchParams({
      location: `${origin.latitude},${origin.longitude}`,
      radius: String(NEARBY_SEARCH_RADIUS_M),
      keyword: query,
      key: GOOGLE_PLACES_API_KEY,
      language: 'en',
    });
    return fetchGooglePlaceSearch('nearbysearch', params);
  };

  const fetchGoogleTextSearch = async (query, origin) => {
    const params = new URLSearchParams({
      query,
      key: GOOGLE_PLACES_API_KEY,
      language: 'en',
    });
    if (origin) {
      params.set('location', `${origin.latitude},${origin.longitude}`);
      params.set('radius', String(NEARBY_SEARCH_RADIUS_M));
    }
    return fetchGooglePlaceSearch('textsearch', params);
  };

  const fetchGoogleAutocomplete = async (query, origin) => {
    if (!GOOGLE_PLACES_API_KEY) return [];

    const biasLat = origin?.latitude ?? MOGADISHU_REGION.latitude;
    const biasLng = origin?.longitude ?? MOGADISHU_REGION.longitude;

    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_PLACES_API_KEY,
      language: 'en',
      location: `${biasLat},${biasLng}`,
      radius: String(NEARBY_SEARCH_RADIUS_M),
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!response.ok) {
      throw new Error(`Google autocomplete failed: ${response.status}`);
    }

    const payload = await response.json();
    if (payload?.status && !['OK', 'ZERO_RESULTS'].includes(payload.status)) {
      console.warn('Google autocomplete status:', payload.status, payload?.error_message);
      return [];
    }
    const predictions = Array.isArray(payload?.predictions) ? payload.predictions : [];
    return predictions.map(parseGooglePrediction).filter(Boolean);
  };

  const fetchGoogleSuggestions = async (query, origin) => {
    if (!GOOGLE_PLACES_API_KEY) return [];

    const [nearbyResults, textResults, autocompleteResults] = await Promise.all([
      origin ? fetchGoogleNearbySearch(query, origin) : Promise.resolve([]),
      fetchGoogleTextSearch(query, origin),
      fetchGoogleAutocomplete(query, origin),
    ]);

    return dedupePlaces([...nearbyResults, ...textResults, ...autocompleteResults]);
  };

  const fetchGooglePlaceDetails = async (place) => {
    if (!GOOGLE_PLACES_API_KEY || !place?.placeId) return null;

    const params = new URLSearchParams({
      place_id: place.placeId,
      fields: 'name,formatted_address,geometry',
      key: GOOGLE_PLACES_API_KEY,
      language: 'en',
    });
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!response.ok) {
      throw new Error(`Google place details failed: ${response.status}`);
    }

    const payload = await response.json();
    if (payload?.status && payload.status !== 'OK') {
      console.warn('Google place details status:', payload.status, payload?.error_message);
      return null;
    }

    const result = payload?.result;
    const latitude = Number(result?.geometry?.location?.lat);
    const longitude = Number(result?.geometry?.location?.lng);
    if (!isCoordinateInSomalia(latitude, longitude)) return null;
    return {
      ...place,
      name: String(result?.name || place.name).trim(),
      address: String(result?.formatted_address || place.address || '').trim(),
      latitude,
      longitude,
    };
  };

  const fetchOpenStreetMapSuggestions = async (query, origin) => {
    const lat = origin?.latitude ?? MOGADISHU_REGION.latitude;
    const lng = origin?.longitude ?? MOGADISHU_REGION.longitude;
    const delta = 0.35;
    const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
    const encoded = encodeURIComponent(query);
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=15&countrycodes=so&bounded=1&viewbox=${viewbox}&q=${encoded}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    const rows = await response.json();
    return Array.isArray(rows) ? rows.map(parseSearchResult).filter(Boolean) : [];
  };

  const fetchPhotonSuggestions = async (query, origin) => {
    const lat = origin?.latitude ?? MOGADISHU_REGION.latitude;
    const lon = origin?.longitude ?? MOGADISHU_REGION.longitude;
    const encoded = encodeURIComponent(query);
    const url =
      `https://photon.komoot.io/api/?q=${encoded}&limit=15&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Photon search failed: ${response.status}`);
    }
    const payload = await response.json();
    const features = Array.isArray(payload?.features) ? payload.features : [];
    return features.map(parsePhotonResult).filter(Boolean);
  };

  const fetchGeocodeSuggestions = async (query) => {
    const queryVariants = [`${query}, Somalia`, `${query}, Mogadishu, Somalia`];
    const results = [];

    for (const q of queryVariants) {
      try {
        const rows = await Location.geocodeAsync(q);
        for (const [index, row] of rows.entries()) {
          const place = parseGeocodeResult(query, row, index);
          if (!place) continue;

          try {
            const reverseRows = await Location.reverseGeocodeAsync({
              latitude: place.latitude,
              longitude: place.longitude,
            });
            const address = reverseRows?.[0] ? formatReverseAddress(reverseRows[0]) : '';
            results.push({ ...place, address });
          } catch {
            results.push(place);
          }
        }
      } catch (error) {
        console.warn('Expo geocode suggestions failed', error);
      }
    }

    return results;
  };

  const fetchPlaceSuggestions = async (query) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const origin = getSearchBiasOrigin();

    if (GOOGLE_PLACES_API_KEY) {
      try {
        const googlePlaces = await fetchGoogleSuggestions(cleanQuery, origin);
        if (googlePlaces.length > 0) {
          return attachDistanceAndSort(googlePlaces, origin).slice(0, MAX_SUGGESTIONS);
        }
      } catch (error) {
        console.warn('Google place suggestions failed', error);
      }
    }

    const queryVariants = buildSuggestionQueries(cleanQuery);
    const [osmResults, photonResults, geocodeResult] = await Promise.all([
      Promise.allSettled(queryVariants.map((variant) => fetchOpenStreetMapSuggestions(variant, origin))),
      Promise.allSettled(queryVariants.map((variant) => fetchPhotonSuggestions(variant, origin))),
      cleanQuery.length >= 3 ? fetchGeocodeSuggestions(cleanQuery) : Promise.resolve([]),
    ]);

    const osmPlaces = osmResults.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    );
    const photonPlaces = photonResults.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    );
    const geocodePlaces = geocodeResult;
    const merged = dedupePlaces([...osmPlaces, ...photonPlaces, ...geocodePlaces]);
    const filtered = merged.filter((place) => isRelevantPlace(place, cleanQuery));
    const results = filtered.length > 0 ? filtered : merged;
    return attachDistanceAndSort(results, origin).slice(0, MAX_SUGGESTIONS);
  };

  const resolveAddressFromCoords = async (latitude, longitude) => {
    try {
      const geocodeList = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocodeList && geocodeList.length > 0) {
        const place = geocodeList[0];
        const constructedAddress = formatReverseAddress(place);

        if (areaMode) {
          return {
            name: constructedAddress || 'Unknown Area',
            address: '',
          };
        }

        const rawName = (place.name || '').trim();
        const friendlyName = !looksLikePlusCode(rawName)
          ? rawName
          : ((place.streetName || place.street || place.district || place.subregion || place.city || 'Selected Location').trim());

        return {
          name: friendlyName || 'Selected Location',
          address: constructedAddress,
        };
      }
    } catch (e) {
      console.warn('Reverse geocode failed', e);
    }

    return areaMode
      ? { name: 'Unknown Area', address: '' }
      : { name: 'Selected Location', address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` };
  };

  const formatNearbyPromptLine = (details) => {
    if (!details) return 'Your current area';
    const areaLine = String(details.address || '').trim();
    if (areaLine) return areaLine;
    return String(details.name || 'Your current area').trim();
  };

  const centerMapOn = (coord, options = {}) => {
    const nextRegion = {
      latitude: coord.latitude,
      longitude: coord.longitude,
      latitudeDelta: options.latitudeDelta ?? 0.025,
      longitudeDelta: options.longitudeDelta ?? 0.025,
    };
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 350);
  };

  const reverseGeocode = async (latitude, longitude) => {
    const nextDetails = await resolveAddressFromCoords(latitude, longitude);
    setAddressDetails(nextDetails);
    return nextDetails;
  };

  const setPin = async (coord, options = {}) => {
    setNearbyPromptVisible(false);
    const nextRegion = {
      latitude: coord.latitude,
      longitude: coord.longitude,
      latitudeDelta: options.latitudeDelta ?? 0.025,
      longitudeDelta: options.longitudeDelta ?? 0.025,
    };
    setRegion(nextRegion);
    setMarkerCoord(coord);
    mapRef.current?.animateToRegion(nextRegion, 350);
    const details = await reverseGeocode(coord.latitude, coord.longitude);
    if (!areaMode) {
      if (options.venueName) {
        setAddressDetails((prev) => ({
          ...prev,
          name: options.venueName,
          address:
            options.venueAddress ||
            prev.address ||
            details?.address ||
            `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`,
        }));
      } else if (options.nameFallback && details?.name === 'Selected Location') {
        setAddressDetails((prev) => ({ ...prev, name: options.nameFallback }));
      }
    }
  };

  const detectNearbyLocation = async ({ silent = false } = {}) => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!silent) {
          Alert.alert('Permission needed', 'Allow location access or search for the venue instead.');
        }
        return null;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      const details = await resolveAddressFromCoords(coord.latitude, coord.longitude);
      centerMapOn(coord);
      setSearchOrigin(coord);
      setNearbySuggestion({
        ...coord,
        name: details.name,
        address: details.address,
      });
      setNearbyPromptVisible(true);
      return coord;
    } catch (error) {
      console.warn('Could not fetch location', error);
      if (!silent) {
        Alert.alert('Location unavailable', 'Search for the venue or tap the map to place the pin.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const acceptNearbyVenue = async () => {
    if (!nearbySuggestion) return;
    await setPin(
      { latitude: nearbySuggestion.latitude, longitude: nearbySuggestion.longitude },
      {
        venueName: nearbySuggestion.name,
        venueAddress: nearbySuggestion.address,
      },
    );
  };

  const dismissNearbyPrompt = () => {
    setNearbyPromptVisible(false);
  };

  const useCurrentLocation = async () => {
    await detectNearbyLocation({ silent: false });
  };

  useEffect(() => {
    if (!visible) {
      setNearbySuggestion(null);
      setNearbyPromptVisible(false);
      setSearchOrigin(null);
      return;
    }

    (async () => {
      setInitialLoading(true);
      setNearbySuggestion(null);
      setNearbyPromptVisible(false);
      const latitude = Number(initialLocation?.latitude);
      const longitude = Number(initialLocation?.longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        setSearchQuery(initialLocation?.name || '');
        setAddressDetails({
          name: initialLocation?.name || 'Selected Location',
          address: initialLocation?.address || '',
        });
        await setPin({ latitude, longitude });
        setSearchOrigin({ latitude, longitude });
        setInitialLoading(false);
        return;
      }

      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      setMarkerCoord(null);
      setAddressDetails({ name: '', address: '' });
      setRegion(MOGADISHU_REGION);
      await detectNearbyLocation({ silent: true });
      setInitialLoading(false);
    })();
  }, [visible]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!visible || !showSuggestions || query.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const rows = await fetchPlaceSuggestions(query);
        if (!cancelled) setSuggestions(rows);
      } catch (error) {
        console.warn('Place suggestions failed', error);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible, searchQuery, showSuggestions, searchOrigin, nearbySuggestion]);

  const handleMapPress = async (e) => {
    const coord = e.nativeEvent.coordinate;
    setShowSuggestions(false);
    dismissNearbyPrompt();
    await setPin(coord);
  };

  const selectSuggestion = async (place) => {
    dismissNearbyPrompt();
    const resolvedPlace =
      place.source === 'google' && place.placeId && !Number.isFinite(place.latitude)
        ? await fetchGooglePlaceDetails(place)
        : place;

    if (!resolvedPlace) {
      Alert.alert('Place unavailable', 'Could not verify this place inside Somalia. Please choose another suggestion.');
      return;
    }

    setShowSuggestions(false);
    setSuggestions([]);

    if (areaMode) {
      // In area mode: drop the pin and let reverseGeocode produce district, region, city
      setSearchQuery('');
      await setPin({ latitude: resolvedPlace.latitude, longitude: resolvedPlace.longitude });
    } else {
      setSearchQuery(resolvedPlace.name);
      setAddressDetails({ name: resolvedPlace.name, address: resolvedPlace.address || '' });
      await setPin(
        { latitude: resolvedPlace.latitude, longitude: resolvedPlace.longitude },
        { venueName: resolvedPlace.name, venueAddress: resolvedPlace.address },
      );
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    if (suggestions.length > 0) {
      await selectSuggestion(suggestions[0]);
      return;
    }

    setLoading(true);
    try {
      const placeRows = await fetchPlaceSuggestions(query);
      if (placeRows.length > 0) {
        await selectSuggestion(placeRows[0]);
        return;
      }

      const matches = await Location.geocodeAsync(query);
      if (!matches?.length) {
        Alert.alert('Venue not found', 'Try a more specific venue name or tap the map to place the pin.');
        return;
      }
      const first = matches[0];
      await setPin(
        {
          latitude: first.latitude,
          longitude: first.longitude,
        },
        { venueName: query },
      );
    } catch (error) {
      console.warn('Venue search failed', error);
      Alert.alert('Search failed', 'Please try again or tap the map to place the pin.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!markerCoord) return;
    onSelectLocation({
      locationName: addressDetails.name || (areaMode ? 'Unknown Area' : searchQuery.trim() || 'Selected Location'),
      locationAddress: areaMode ? '' : addressDetails.address,
      latitude: markerCoord.latitude,
      longitude: markerCoord.longitude,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>{areaMode ? 'Set your area' : 'Set venue pin'}</Text>
            <Text style={styles.subtitle}>
              {areaMode
                ? 'Search a district or drag the map to your area'
                : 'We read where you are first — confirm or search for a venue'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.mapContainer}>
          {initialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF7B3F" />
              <Text style={{ marginTop: 10, color: '#666' }}>Finding your location...</Text>
            </View>
          ) : (
            <>
            <MapView
                ref={mapRef}
              style={styles.map}
              initialRegion={region}
              onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton
            >
              {markerCoord && (
                <Marker
                  coordinate={markerCoord}
                  draggable
                  onDragEnd={(e) => handleMapPress(e)}
                  pinColor="#FF7B3F"
                />
              )}
            </MapView>
              <View style={styles.searchCard}>
                <Feather name="search" size={18} color="#6B7280" />
                <TextInput
                  value={searchQuery}
                  onChangeText={(value) => {
                    setSearchQuery(value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setShowSuggestions(true);
                    dismissNearbyPrompt();
                  }}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  placeholder="Search places nearby..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    style={styles.searchClearBtn}
                    hitSlop={8}
                  >
                    <Feather name="x" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  style={[styles.searchButton, (!searchQuery.trim() || loading) && styles.searchButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FF7B3F" />
                  ) : (
                    <Text style={styles.searchButtonText}>Find</Text>
                  )}
                </TouchableOpacity>
              </View>
              {showSuggestions && searchQuery.trim().length >= 2 ? (
                <View style={[styles.suggestionsCard, { maxHeight: SUGGESTIONS_MAX_HEIGHT }]}>
                  {suggestionsLoading ? (
                    <View style={styles.suggestionStatusRow}>
                      <ActivityIndicator size="small" color="#FF7B3F" />
                      <Text style={styles.suggestionStatusText}>Finding places near you...</Text>
                    </View>
                  ) : suggestions.length > 0 ? (
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                    >
                      {suggestions.map((place) => (
                        <TouchableOpacity
                          key={place.id}
                          style={styles.suggestionRow}
                          activeOpacity={0.85}
                          onPress={() => selectSuggestion(place)}
                        >
                          <View style={styles.suggestionLeading}>
                            <View style={styles.suggestionIcon}>
                              <Feather
                                name={place.source === 'google' ? 'map-pin' : 'map-pin'}
                                size={15}
                                color="#EA580C"
                              />
                            </View>
                            {Number.isFinite(place.distanceMeters) ? (
                              <Text style={styles.suggestionDistance}>
                                {formatDistanceMeters(place.distanceMeters)}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.suggestionTextWrap}>
                            <Text style={styles.suggestionTitle} numberOfLines={1}>
                              {place.name}
                            </Text>
                            <Text style={styles.suggestionAddress} numberOfLines={2}>
                              {place.address || 'Nearby place'}
                            </Text>
                          </View>
                          <Feather name="corner-up-left" size={16} color="#CBD5E1" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.suggestionStatusRow}>
                      <Feather name="info" size={15} color="#9CA3AF" />
                      <Text style={styles.suggestionStatusText}>
                        {GOOGLE_PLACES_API_KEY
                          ? 'No nearby places found. Try another name or tap the map.'
                          : 'No places found nearby. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for full search, or tap the map.'}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
              {nearbyPromptVisible && nearbySuggestion && !markerCoord ? (
                <View style={styles.nearbyPromptCard}>
                  <View style={styles.nearbyPromptHeader}>
                    <View style={styles.nearbyPromptIcon}>
                      <Feather name="navigation" size={16} color="#EA580C" />
                    </View>
                    <View style={styles.nearbyPromptTextWrap}>
                      <Text style={styles.nearbyPromptEyebrow}>You&apos;re here</Text>
                      <Text style={styles.nearbyPromptPlace} numberOfLines={2}>
                        {formatNearbyPromptLine(nearbySuggestion)}
                      </Text>
                      <Text style={styles.nearbyPromptQuestion}>
                        {areaMode ? 'Is this the area you want to use?' : 'Is this your event venue?'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.nearbyPromptActions}>
                    <TouchableOpacity
                      style={styles.nearbyPromptSecondaryBtn}
                      activeOpacity={0.85}
                      onPress={dismissNearbyPrompt}
                    >
                      <Text style={styles.nearbyPromptSecondaryText}>No, search instead</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.nearbyPromptPrimaryBtn}
                      activeOpacity={0.85}
                      onPress={acceptNearbyVenue}
                    >
                      <Text style={styles.nearbyPromptPrimaryText}>Yes, pin here</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.currentLocationBtn} onPress={useCurrentLocation}>
                  <Feather name="crosshair" size={18} color="#FF7B3F" />
                  <Text style={styles.currentLocationText}>Refresh my location</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>{areaMode ? 'Your area' : 'Selected venue'}</Text>
          <View style={styles.addressBox}>
            {markerCoord ? (
              <>
                <Text style={styles.addressName} numberOfLines={2}>{addressDetails.name || (areaMode ? 'Unknown Area' : 'Unknown Venue')}</Text>
                {!areaMode && (
                  <Text style={styles.addressText} numberOfLines={2}>
                    {addressDetails.address || 'Map pin selected'}
                  </Text>
                )}
                <Text style={styles.pinSavedText}>{areaMode ? 'This area will be used for event discovery.' : 'Exact directions will use this pin.'}</Text>
              </>
            ) : (
              <Text style={styles.placeholderText}>{areaMode ? 'Search or tap the map to set your area.' : 'Search a venue or tap the map to place a pin.'}</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.confirmBtn, !markerCoord && styles.confirmBtnDisabled]} 
            onPress={handleConfirm}
            disabled={!markerCoord}
          >
            <Text style={styles.confirmText}>{areaMode ? 'Confirm Location' : 'Confirm venue pin'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#EBEBEB',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchCard: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 15,
  },
  searchClearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  searchButton: {
    minWidth: 54,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.55,
  },
  searchButtonText: {
    color: '#EA580C',
    fontWeight: '800',
  },
  suggestionsCard: {
    position: 'absolute',
    top: 72,
    left: 14,
    right: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 9,
    zIndex: 4,
  },
  suggestionRow: {
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionLeading: {
    width: 52,
    alignItems: 'center',
    marginRight: 4,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionDistance: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  suggestionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  suggestionTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  suggestionAddress: {
    marginTop: 3,
    color: '#6B7280',
    fontSize: 12,
  },
  suggestionStatusRow: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  suggestionStatusText: {
    flex: 1,
    minWidth: 0,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  currentLocationBtn: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
  },
  currentLocationText: {
    color: '#EA580C',
    fontWeight: '800',
    fontSize: 12,
  },
  nearbyPromptCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 5,
  },
  nearbyPromptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  nearbyPromptIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyPromptTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  nearbyPromptEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  nearbyPromptPlace: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 22,
  },
  nearbyPromptQuestion: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  nearbyPromptActions: {
    flexDirection: 'row',
    gap: 8,
  },
  nearbyPromptSecondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  nearbyPromptSecondaryText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  nearbyPromptPrimaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#FF7B3F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  nearbyPromptPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    marginTop: -20,
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  addressBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF0F4',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    minHeight: 76,
    justifyContent: 'center',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  pinSavedText: {
    marginTop: 8,
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '700',
  },
  placeholderText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  confirmBtn: {
    backgroundColor: '#FF7B3F',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#FFCAA2',
  },
  confirmText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  }
});