import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as ExpoLocation from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import LocationSvg from '@/assets/location2.svg';
import { logApiError } from '@/api/logApiError';
import { SOMALIA_DISTRICTS } from '@/constants/somaliaDistricts';
import { resolveSomaliaDistrictFromGeocode, reverseGeocodePlaceFromCoords } from '@/utils/somaliaDistrictMatch';

const ORANGE = '#FF7B3F';
const INPUT_BORDER = 'rgba(255,123,63,0.28)';
const DEFAULT_COUNTRY = 'Somalia';

/** Organizer location: city + country (e.g. Mogadishu, Somalia). */
function formatOrganizerLocation(item, country = DEFAULT_COUNTRY) {
  const city = item?.city?.trim() || '';
  const resolvedCountry = item?.country?.trim() || country;
  if (city && resolvedCountry) {
    return `${city}, ${resolvedCountry}`;
  }
  return city || resolvedCountry || '';
}

function dedupeByCity(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.city.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function VerificationLocationStep({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isDetecting, setIsDetecting] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.High,
        });
        const place = await reverseGeocodePlaceFromCoords(
          pos.coords.latitude,
          pos.coords.longitude,
        );

        if (place) {
          const countryName = place.country || DEFAULT_COUNTRY;
          const match = resolveSomaliaDistrictFromGeocode(place);
          const detected = formatOrganizerLocation(
            {
              city: match?.city || place.city || place.district || place.subregion,
              country: countryName,
            },
            countryName,
          );
          if (detected) {
            setQuery(detected);
            onChange(detected);
          }
        }
      } catch (e) {
        logApiError(e, 'GET location/detect');
      } finally {
        setIsDetecting(false);
      }
    })();
  }, [onChange]);

  const handleQueryChange = (text) => {
    setQuery(text);
    onChange(text.trim());

    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const lower = text.toLowerCase();
    const matches = dedupeByCity(
      SOMALIA_DISTRICTS.filter(
        (d) =>
          d.city.toLowerCase().includes(lower) ||
          d.region.toLowerCase().includes(lower) ||
          d.district.toLowerCase().includes(lower),
      ),
    ).slice(0, 6);

    setSuggestions(matches);
  };

  const handleSelect = (item) => {
    const formatted = formatOrganizerLocation(item);
    setQuery(formatted);
    onChange(formatted);
    setSuggestions([]);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.heroWrap}>
        <LocationSvg width="100%" height="100%" />
      </View>

      <View style={styles.inputWrap}>
        <Ionicons name="search-outline" size={18} color={ORANGE} style={styles.inputIconLeft} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={isDetecting ? 'Detecting your location…' : 'Search city or country'}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleQueryChange}
        />
        {query.length > 0 ? (
          <Pressable
            style={styles.clearBtn}
            hitSlop={8}
            onPress={() => {
              setQuery('');
              onChange('');
              setSuggestions([]);
            }}
          >
            <Ionicons name="close-circle" size={18} color="#CCC" />
          </Pressable>
        ) : null}
        {isDetecting ? (
          <ActivityIndicator size="small" color={ORANGE} style={styles.detectSpinner} />
        ) : null}
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.dropdown}>
          {suggestions.map((item, idx) => (
            <Pressable
              key={`${item.city}-${item.district}-${idx}`}
              style={[styles.suggestionRow, idx < suggestions.length - 1 && styles.suggestionDivider]}
              onPress={() => handleSelect(item)}
            >
              <Ionicons name="location-outline" size={15} color={ORANGE} style={{ marginRight: 8, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionMain}>{formatOrganizerLocation(item)}</Text>
                {item.region ? (
                  <Text style={styles.suggestionSub}>{item.region}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  heroWrap: {
    width: '100%',
    height: 220,
    alignSelf: 'center',
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIconLeft: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 12,
  },
  clearBtn: {
    padding: 4,
  },
  detectSpinner: {
    marginLeft: 6,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  suggestionSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
