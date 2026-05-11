import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

export default function LocationPickerModal({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
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
      .filter((token) => token.length >= 3 && !INSTITUTION_KEYWORDS.includes(token));
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

  const formatReverseAddress = (place) =>
    [
      place?.name,
      place?.streetName || place?.street,
      place?.district,
      place?.city,
      place?.region,
      place?.country,
    ]
      .filter(Boolean)
      .join(', ');

  const dedupePlaces = (places) => {
    const seen = new Set();
    return places.filter((place) => {
      const addressKey = String(place.address || '').toLowerCase();
      const key = addressKey
        ? `${place.name.toLowerCase()}-${addressKey}`
        : `${place.name.toLowerCase()}-${place.latitude.toFixed(4)}-${place.longitude.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const fetchGoogleAutocomplete = async (query, types = 'establishment') => {
    if (!GOOGLE_PLACES_API_KEY) return [];

    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_PLACES_API_KEY,
      language: 'en',
      components: 'country:so',
      location: `${MOGADISHU_REGION.latitude},${MOGADISHU_REGION.longitude}`,
      radius: '900000',
      strictbounds: 'true',
    });
    if (types) params.set('types', types);

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

  const fetchGoogleSuggestions = async (query) => {
    if (!GOOGLE_PLACES_API_KEY) return [];

    const establishmentResults = await fetchGoogleAutocomplete(query, 'establishment');
    if (establishmentResults.length > 0) return establishmentResults;
    return fetchGoogleAutocomplete(query, '');
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

  const fetchOpenStreetMapSuggestions = async (query) => {
    const encoded = encodeURIComponent(query);
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=12&countrycodes=so&bounded=1&viewbox=40.9,12.2,51.5,-1.7&q=${encoded}`;
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

  const fetchPhotonSuggestions = async (query) => {
    const encoded = encodeURIComponent(query);
    const url =
      `https://photon.komoot.io/api/?q=${encoded}&limit=12&bbox=40.9,-1.7,51.5,12.2`;
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

    if (GOOGLE_PLACES_API_KEY) {
      try {
        const googlePlaces = await fetchGoogleSuggestions(cleanQuery);
        if (googlePlaces.length > 0) return googlePlaces.slice(0, 8);
      } catch (error) {
        console.warn('Google place suggestions failed', error);
      }
    }

    const shouldUseGeocodeFallback = cleanQuery.split(/\s+/).length >= 2 || cleanQuery.length >= 12;
    const queryVariants = buildSuggestionQueries(cleanQuery);
    const [osmResults, photonResults, geocodeResult] = await Promise.all([
      Promise.allSettled(queryVariants.map(fetchOpenStreetMapSuggestions)),
      Promise.allSettled(queryVariants.map(fetchPhotonSuggestions)),
      shouldUseGeocodeFallback ? fetchGeocodeSuggestions(cleanQuery) : Promise.resolve([]),
    ]);

    const osmPlaces = osmResults.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    );
    const photonPlaces = photonResults.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    );
    const geocodePlaces = geocodeResult;
    const realPlaces = dedupePlaces([...osmPlaces, ...photonPlaces]).filter((place) =>
      isRelevantPlace(place, cleanQuery),
    );
    const fallbackPlaces = realPlaces.length > 1 ? [] : geocodePlaces;
    return dedupePlaces([...realPlaces, ...fallbackPlaces]).slice(0, 8);
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const geocodeList = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocodeList && geocodeList.length > 0) {
        const place = geocodeList[0];
        const constructedAddress = formatReverseAddress(place);
        const rawName = (place.name || '').trim();
        const friendlyName = !looksLikePlusCode(rawName)
          ? rawName
          : ((place.streetName || place.street || place.district || place.subregion || place.city || 'Selected Location').trim());
        
        const nextDetails = {
          name: friendlyName || 'Selected Location',
          address: constructedAddress,
        };
        setAddressDetails(nextDetails);
        return nextDetails;
      }
    } catch (e) {
      console.warn("Reverse geocode failed", e);
    }
    const fallback = { name: 'Selected Location', address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` };
    setAddressDetails(fallback);
    return fallback;
  };

  const setPin = async (coord, options = {}) => {
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
  };

  const useCurrentLocation = async ({ silent = false } = {}) => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!silent) {
          Alert.alert('Permission needed', 'Allow location access or search for the venue instead.');
        }
        return false;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await setPin({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      return true;
    } catch (error) {
      console.warn('Could not fetch location', error);
      if (!silent) {
        Alert.alert('Location unavailable', 'Search for the venue or tap the map to place the pin.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;

    (async () => {
      setInitialLoading(true);
      const latitude = Number(initialLocation?.latitude);
      const longitude = Number(initialLocation?.longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        setSearchQuery(initialLocation?.name || '');
        setAddressDetails({
          name: initialLocation?.name || 'Selected Location',
          address: initialLocation?.address || '',
        });
        await setPin({ latitude, longitude });
        setInitialLoading(false);
        return;
      }

      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      setMarkerCoord(null);
      setAddressDetails({ name: '', address: '' });
      setRegion(MOGADISHU_REGION);
      await useCurrentLocation({ silent: true });
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
  }, [visible, searchQuery, showSuggestions]);

  const handleMapPress = async (e) => {
    const coord = e.nativeEvent.coordinate;
    setShowSuggestions(false);
    await setPin(coord);
  };

  const selectSuggestion = async (place) => {
    const resolvedPlace = place.source === 'google'
      ? await fetchGooglePlaceDetails(place)
      : place;

    if (!resolvedPlace) {
      Alert.alert('Place unavailable', 'Could not verify this place inside Somalia. Please choose another suggestion.');
      return;
    }

    setSearchQuery(resolvedPlace.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setAddressDetails({ name: resolvedPlace.name, address: resolvedPlace.address || '' });
    await setPin(
      {
        latitude: resolvedPlace.latitude,
        longitude: resolvedPlace.longitude,
      },
      { venueName: resolvedPlace.name, venueAddress: resolvedPlace.address },
    );
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
      locationName: addressDetails.name || searchQuery.trim() || 'Selected Location',
      locationAddress: addressDetails.address,
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
            <Text style={styles.title}>Set venue pin</Text>
            <Text style={styles.subtitle}>Search, use your location, or tap the map</Text>
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
                  onFocus={() => setShowSuggestions(true)}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  placeholder="Search venue, hotel, hall..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
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
                <View style={styles.suggestionsCard}>
                  {suggestionsLoading ? (
                    <View style={styles.suggestionStatusRow}>
                      <ActivityIndicator size="small" color="#FF7B3F" />
                      <Text style={styles.suggestionStatusText}>Finding matching places...</Text>
                    </View>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        style={styles.suggestionRow}
                        activeOpacity={0.85}
                        onPress={() => selectSuggestion(place)}
                      >
                        <View style={styles.suggestionIcon}>
                          <Feather
                            name={place.source === 'google' ? 'navigation' : 'map-pin'}
                            size={15}
                            color="#EA580C"
                          />
                        </View>
                        <View style={styles.suggestionTextWrap}>
                          <Text style={styles.suggestionTitle} numberOfLines={1}>
                            {place.name}
                          </Text>
                          <Text style={styles.suggestionAddress} numberOfLines={2}>
                            {place.address || 'Use this venue name in Somalia'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.suggestionStatusRow}>
                      <Feather name="info" size={15} color="#9CA3AF" />
                      <Text style={styles.suggestionStatusText}>
                        No verified Somalia places found yet. Try the full venue name.
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
              <TouchableOpacity style={styles.currentLocationBtn} onPress={() => useCurrentLocation()}>
                <Feather name="navigation" size={18} color="#FF7B3F" />
                <Text style={styles.currentLocationText}>Use current location</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Selected venue</Text>
          <View style={styles.addressBox}>
            {markerCoord ? (
              <>
                <Text style={styles.addressName} numberOfLines={1}>{addressDetails.name || 'Unknown Venue'}</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {addressDetails.address || 'Map pin selected'}
                </Text>
                <Text style={styles.pinSavedText}>Exact directions will use this pin.</Text>
              </>
            ) : (
              <Text style={styles.placeholderText}>Search a venue or tap the map to place a pin.</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.confirmBtn, !markerCoord && styles.confirmBtnDisabled]} 
            onPress={handleConfirm}
            disabled={!markerCoord}
          >
            <Text style={styles.confirmText}>Confirm venue pin</Text>
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
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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