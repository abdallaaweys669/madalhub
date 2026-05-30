import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Open driving directions from the user's current location to the event venue.
 */
export async function openDirectionsToVenue({
  latitude,
  longitude,
  label = 'Event venue',
  addressQuery = '',
}) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const query = typeof addressQuery === 'string' ? addressQuery.trim() : '';

  if (!hasCoords && !query) {
    Alert.alert('Map unavailable', 'This event does not have a physical venue location yet.');
    return false;
  }

  let origin = '';
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const uLat = position.coords.latitude;
      const uLng = position.coords.longitude;
      if (Number.isFinite(uLat) && Number.isFinite(uLng)) {
        origin = `${uLat},${uLng}`;
      }
    }
  } catch {
    // Native maps can still use device GPS when origin is omitted.
  }

  const destination = hasCoords ? `${lat},${lng}` : encodeURIComponent(query);
  const googleDir = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

  const tryOpen = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) return false;
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (hasCoords) {
    if (Platform.OS === 'android') {
      try {
        await Linking.openURL(`google.navigation:q=${destination}`);
        return true;
      } catch {
        /* fall through */
      }
      if (await tryOpen(googleDir)) return true;
    } else {
      const appleUrl = origin
        ? `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`
        : `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
      if (await tryOpen(appleUrl)) return true;
      if (await tryOpen(`maps://?daddr=${destination}&dirflg=d`)) return true;
      if (await tryOpen(`comgooglemaps://?daddr=${destination}&directionsmode=driving`)) return true;
      if (await tryOpen(googleDir)) return true;
    }
  } else if (await tryOpen(googleDir)) {
    return true;
  }

  try {
    await Linking.openURL(googleDir);
    return true;
  } catch {
    Alert.alert(
      'Unable to open maps',
      'Allow location access and install Google Maps or Apple Maps, then try again.',
    );
    return false;
  }
}
