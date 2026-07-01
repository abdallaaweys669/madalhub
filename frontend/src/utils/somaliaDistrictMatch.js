import * as Location from 'expo-location';
import { SOMALIA_DISTRICTS } from '@/constants/somaliaDistricts';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';

/** Common spellings → canonical district name in SOMALIA_DISTRICTS. */
const DISTRICT_ALIASES = {
  garasbaaley: 'Garasbaaley',
  garasbaaleey: 'Garasbaaley',
  garabaley: 'Garasbaaley',
  garabale: 'Garasbaaley',
  garasbaley: 'Garasbaaley',
  garasballey: 'Garasbaaley',
  dayniile: 'Daynile',
  daynile: 'Daynile',
  howlwadaag: 'Hawl Wadaag',
  hawlwadaag: 'Hawl Wadaag',
  warta: 'Warta Nabada',
  xamarweyne: 'Hamar Weyne',
  xamar: 'Hamar Weyne',
};

const FIELD_WEIGHTS = {
  subregion: 1.2,
  name: 1.15,
  street: 1.1,
  streetName: 1.1,
  formattedAddress: 1.08,
  district: 0.82,
  city: 0.65,
};

export function normalizeDistrictToken(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/degmada\s*/g, '')
    .replace(/district\s*/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function regionMatches(placeRegion, entryRegion) {
  const gpsRegion = normalizeDistrictToken(placeRegion);
  const listRegion = normalizeDistrictToken(entryRegion);
  if (!gpsRegion) return true;
  return (
    listRegion === gpsRegion ||
    listRegion.includes(gpsRegion) ||
    gpsRegion.includes(listRegion)
  );
}

function scoreTokenAgainstDistrict(token, listDistrict) {
  if (!token || token.length < 3) return 0;

  const aliasCanonical = DISTRICT_ALIASES[token];
  const aliasToken = aliasCanonical ? normalizeDistrictToken(aliasCanonical) : '';

  const candidates = [token, aliasToken].filter(Boolean);
  let best = 0;

  for (const candidate of candidates) {
    if (candidate === listDistrict) {
      best = Math.max(best, 100);
      continue;
    }
    if (candidate.length >= 4 && listDistrict.length >= 4) {
      if (candidate.startsWith(listDistrict) || listDistrict.startsWith(candidate)) {
        best = Math.max(best, 88);
        continue;
      }
      if (candidate.includes(listDistrict) || listDistrict.includes(candidate)) {
        best = Math.max(best, 72);
      }
    }
  }

  return best;
}

function findBestDistrictForToken(token, placeRegion) {
  let bestEntry = null;
  let bestScore = 0;

  for (const entry of SOMALIA_DISTRICTS) {
    if (!regionMatches(placeRegion, entry.region)) continue;

    const listDistrict = normalizeDistrictToken(entry.district);
    const score = scoreTokenAgainstDistrict(token, listDistrict);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestEntry && bestScore >= 72 ? { entry: bestEntry, score: bestScore } : null;
}

function collectTokens(place) {
  const tokens = [];
  const seen = new Set();

  const addToken = (raw, field) => {
    const parts = String(raw || '')
      .split(/[,;|/]/)
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of parts.length ? parts : [raw]) {
      const token = normalizeDistrictToken(part);
      if (token.length < 3) continue;
      const key = `${field}:${token}`;
      if (seen.has(key)) continue;
      seen.add(key);
      tokens.push({ token, weight: FIELD_WEIGHTS[field] || 1, field });
    }
  };

  for (const field of Object.keys(FIELD_WEIGHTS)) {
    addToken(place?.[field], field);
  }

  return tokens;
}

function findDistrictMentionInText(text, placeRegion) {
  const normalized = normalizeDistrictToken(text);
  if (normalized.length < 4) return null;

  let bestEntry = null;
  let bestScore = 0;

  for (const entry of SOMALIA_DISTRICTS) {
    if (!regionMatches(placeRegion, entry.region)) continue;
    const listDistrict = normalizeDistrictToken(entry.district);
    if (listDistrict.length < 4) continue;

    if (normalized.includes(listDistrict)) {
      const score = 96 + Math.min(listDistrict.length, 12);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }
  }

  return bestEntry;
}

function parseGoogleGeocodeResult(result) {
  const components = Array.isArray(result?.address_components) ? result.address_components : [];
  const pick = (...types) => {
    for (const type of types) {
      const row = components.find((item) => Array.isArray(item.types) && item.types.includes(type));
      if (row?.long_name) return String(row.long_name).trim();
    }
    return '';
  };

  return {
    name: pick('neighborhood', 'premise', 'establishment', 'point_of_interest'),
    district: pick('administrative_area_level_3', 'sublocality_level_1', 'neighborhood'),
    subregion: pick('sublocality', 'administrative_area_level_2'),
    region: pick('administrative_area_level_1'),
    city: pick('locality', 'administrative_area_level_2'),
    street: pick('route'),
    formattedAddress: String(result?.formatted_address || '').trim(),
  };
}

async function fetchGoogleReverseGeocode(latitude, longitude) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    key: GOOGLE_MAPS_API_KEY,
    language: 'en',
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) return null;

  const payload = await response.json();
  if (payload?.status !== 'OK' || !Array.isArray(payload.results) || !payload.results[0]) {
    return null;
  }

  return parseGoogleGeocodeResult(payload.results[0]);
}

function mergeGeocodePlaces(googlePlace, expoPlace) {
  return {
    ...(expoPlace || {}),
    ...(googlePlace || {}),
    name: googlePlace?.name || expoPlace?.name || '',
    district: googlePlace?.district || expoPlace?.district || '',
    subregion: googlePlace?.subregion || expoPlace?.subregion || '',
    region: googlePlace?.region || expoPlace?.region || '',
    city: googlePlace?.city || expoPlace?.city || '',
    street: googlePlace?.street || expoPlace?.street || expoPlace?.streetName || '',
    streetName: expoPlace?.streetName || googlePlace?.street || '',
    formattedAddress: googlePlace?.formattedAddress || '',
  };
}

/** Google + device reverse geocode merged into one place object. */
export async function reverseGeocodePlaceFromCoords(latitude, longitude) {
  const [googlePlace, expoRows] = await Promise.all([
    fetchGoogleReverseGeocode(latitude, longitude).catch(() => null),
    Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []),
  ]);

  return mergeGeocodePlaces(googlePlace, expoRows?.[0] || null);
}

/**
 * Resolve GPS reverse-geocode rows to a known Somalia district.
 * Scores all fields together — district alone cannot override a stronger subregion/name match.
 */
export function resolveSomaliaDistrictFromGeocode(place) {
  if (!place) return null;

  const placeRegion = place.region || place.subregion || place.city || '';
  const formattedBlob = [
    place.formattedAddress,
    place.name,
    place.subregion,
    place.street,
    place.streetName,
    place.district,
    place.city,
  ]
    .filter(Boolean)
    .join(' ');

  let bestEntry = findDistrictMentionInText(formattedBlob, placeRegion);
  let bestWeighted = bestEntry ? 110 : 0;

  for (const { token, weight } of collectTokens(place)) {
    const match = findBestDistrictForToken(token, placeRegion);
    if (!match) continue;
    const weighted = match.score * weight;
    if (weighted > bestWeighted) {
      bestWeighted = weighted;
      bestEntry = match.entry;
    }
  }

  return bestEntry;
}

export function formatDetectedLocationFromGeocode(place) {
  const match = resolveSomaliaDistrictFromGeocode(place);
  if (match) {
    return [match.district, match.region, match.city].filter(Boolean).join(', ');
  }

  const fallbackParts = [place?.district, place?.subregion, place?.region, place?.city]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return [...new Set(fallbackParts)].slice(0, 3).join(', ');
}

export function formatResolvedAreaLineFromGeocode(place) {
  return formatDetectedLocationFromGeocode(place);
}
