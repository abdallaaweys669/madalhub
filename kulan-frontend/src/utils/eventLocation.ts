const PLUS_CODE_PATTERN = /\b[2-9CFGHJMPQRVWX]{4,}\+[2-9CFGHJMPQRVWX]{2,}\b/gi;
const TRAILING_COUNTRIES = new Set(['somalia', 'kenya', 'ethiopia', 'djibouti', 'uganda']);

function isPlusCodeSegment(part: string) {
  const t = part.trim();
  if (!t) return true;
  return PLUS_CODE_PATTERN.test(t) || /^[A-Z0-9]{3,}\+[A-Z0-9]{2,}/i.test(t);
}

function titleCaseWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function uniqueParts(parts: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const key = part.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(titleCaseWords(part.trim()));
  }
  return out;
}

/** District, region, city — up to 3 parts (e.g. Hodan, Benadir, Mogadishu). */
export function parseAreaLineFromAddress(rawAddress?: string | null, cityFallback?: string | null) {
  const parts = String(rawAddress || '')
    .replace(PLUS_CODE_PATTERN, '')
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 1 && !isPlusCodeSegment(p));

  const filtered = parts.filter((p) => !TRAILING_COUNTRIES.has(p.toLowerCase()));
  if (filtered.length === 0) {
    const city = String(cityFallback || '').trim();
    return city && !isPlusCodeSegment(city) ? titleCaseWords(city) : '';
  }

  const unique = uniqueParts(filtered);
  if (unique.length >= 3) {
    return unique.slice(-3).join(', ');
  }
  return unique.join(', ');
}

type GeocodePlace = {
  district?: string | null;
  subregion?: string | null;
  region?: string | null;
  city?: string | null;
  name?: string | null;
  street?: string | null;
  streetName?: string | null;
};

/** Area line from expo-location reverse geocode (map pin): district, region, city. */
export function formatAreaLineFromGeocode(place?: GeocodePlace | null) {
  if (!place) return '';
  const candidates = uniqueParts(
    [place.district, place.subregion, place.region, place.city].filter(
      (p): p is string => typeof p === 'string' && Boolean(p.trim()),
    ),
  );
  if (candidates.length >= 3) {
    return candidates.slice(-3).join(', ');
  }
  return candidates.join(', ');
}

export function formatEventLocationDisplay(event?: {
  locationName?: string | null;
  locationAddress?: string | null;
  city?: string | null;
  isOnline?: boolean;
} | null) {
  if (!event) {
    return { venueLine: 'Venue TBA', areaLine: '' };
  }

  const venueRaw = String(event.locationName || '').trim();
  const isOnline =
    event.isOnline === true ||
    venueRaw.toLowerCase() === 'online' ||
    String(event.city || '')
      .trim()
      .toLowerCase() === 'online';

  if (isOnline) {
    return { venueLine: 'Online', areaLine: '' };
  }

  const venueLine =
    venueRaw && !isPlusCodeSegment(venueRaw) ? titleCaseWords(venueRaw) : 'Venue TBA';
  const areaLine = parseAreaLineFromAddress(event.locationAddress, event.city);

  return { venueLine, areaLine };
}

/** Stored on create when organizer picks a map pin (district/region/city only). */
export function formatMapAreaAddress(place?: GeocodePlace | null) {
  const line = formatAreaLineFromGeocode(place);
  return line || parseAreaLineFromAddress(null, place?.city);
}
