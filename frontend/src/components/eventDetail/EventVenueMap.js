import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function EventVenueMap({
  latitude,
  longitude,
  venueLabel = 'Venue',
  mapHeight = 200,
  style,
}) {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [locationHint, setLocationHint] = useState('');

  const venueCoord = {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };

  useEffect(() => {
    let alive = true;

    const fitMap = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive) return;

      if (status !== 'granted') {
        setLocationHint('Turn on location to see where you are on the map.');
        mapRef.current?.animateToRegion(
          { ...venueCoord, latitudeDelta: 0.05, longitudeDelta: 0.05 },
          300,
        );
        return;
      }

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!alive) return;

        const userCoord = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        mapRef.current?.fitToCoordinates([userCoord, venueCoord], {
          edgePadding: { top: 56, right: 56, bottom: 56, left: 56 },
          animated: true,
        });
      } catch {
        if (alive) {
          setLocationHint('Could not get your location. Tap Start navigation to open GPS directions.');
        }
      }
    };

    if (mapReady) {
      fitMap();
    }

    return () => {
      alive = false;
    };
  }, [mapReady, latitude, longitude]);

  return (
    <View style={[styles.wrap, style]}>
      <MapView
        ref={mapRef}
        style={[styles.map, { height: mapHeight }]}
        initialRegion={{
          ...venueCoord,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        showsUserLocation
        showsMyLocationButton
        onMapReady={() => setMapReady(true)}
      >
        <Marker coordinate={venueCoord} title={venueLabel} pinColor="#FF7B3F" />
      </MapView>

      {!mapReady ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#FF7B3F" />
        </View>
      ) : null}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendYou]} />
          <Text style={styles.legendLabel}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendVenue]} />
          <Text style={styles.legendLabel}>Venue</Text>
        </View>
      </View>

      {locationHint ? <Text style={styles.hint}>{locationHint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  map: {
    width: '100%',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendYou: {
    backgroundColor: '#3B82F6',
  },
  legendVenue: {
    backgroundColor: '#FF7B3F',
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  hint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
});
