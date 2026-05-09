import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LocationPickerModal({ visible, onClose, onSelectLocation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [markerCoord, setMarkerCoord] = useState(null);
  const [region, setRegion] = useState({
    latitude: 2.0469, // Default to Mogadishu, Somalia
    longitude: 45.3182,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const [addressDetails, setAddressDetails] = useState({
    name: '',
    address: ''
  });

  const looksLikePlusCode = (value = '') => {
    const v = String(value || '').trim();
    return /^[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,8}$/i.test(v);
  };

  useEffect(() => {
    if (visible) {
      (async () => {
        setInitialLoading(true);
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission denied', 'Allow location access to place the pin on your current location.');
            setInitialLoading(false);
            return;
          }

          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(newRegion);
          setMarkerCoord({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          await reverseGeocode(location.coords.latitude, location.coords.longitude);
        } catch (error) {
          console.warn("Could not fetch location", error);
        } finally {
          setInitialLoading(false);
        }
      })();
    }
  }, [visible]);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const geocodeList = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocodeList && geocodeList.length > 0) {
        const place = geocodeList[0];
        const constructedAddress = [place.streetName || place.street, place.city, place.region || place.country]
          .filter(Boolean)
          .join(', ');
        const rawName = (place.name || '').trim();
        const friendlyName = !looksLikePlusCode(rawName)
          ? rawName
          : ((place.streetName || place.street || place.district || place.subregion || place.city || 'Selected Location').trim());
        
        setAddressDetails({
          name: friendlyName || 'Selected Location',
          address: constructedAddress
        });
      }
    } catch (e) {
      console.warn("Reverse geocode failed", e);
    }
  };

  const handleMapPress = async (e) => {
    const coord = e.nativeEvent.coordinate;
    setMarkerCoord(coord);
    await reverseGeocode(coord.latitude, coord.longitude);
  };

  const handleConfirm = () => {
    if (!markerCoord) return;
    onSelectLocation({
      locationName: addressDetails.name,
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
          <Text style={styles.title}>Pinpoint Location</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.mapContainer}>
          {initialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF7B3F" />
              <Text style={{ marginTop: 10, color: '#666' }}>Finding your location...</Text>
            </View>
          ) : (
            <MapView
              style={styles.map}
              initialRegion={region}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
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
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Selected Address:</Text>
          <View style={styles.addressBox}>
            {markerCoord ? (
              <>
                <Text style={styles.addressName} numberOfLines={1}>{addressDetails.name || 'Unknown Venue'}</Text>
                <Text style={styles.addressText} numberOfLines={2}>{addressDetails.address || 'Address not resolved'}</Text>
              </>
            ) : (
              <Text style={styles.placeholderText}>Tap anywhere on the map to place a pin.</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.confirmBtn, !markerCoord && styles.confirmBtnDisabled]} 
            onPress={handleConfirm}
            disabled={!markerCoord}
          >
            <Text style={styles.confirmText}>Confirm Location</Text>
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
  mapContainer: {
    flex: 1,
    backgroundColor: '#EBEBEB',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: '#F5F5F5',
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