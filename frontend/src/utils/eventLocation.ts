import { formatResolvedAreaLineFromGeocode } from '@/utils/somaliaDistrictMatch';

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
export function parseAreaLineFromAddress(
  rawAddress?: string | null,
  cityFallback?: string | null,
  venueName?: string | null,
) {
  const venueNorm = String(venueName || '').trim().toLowerCase();
  const parts = String(rawAddress || '')
    .replace(PLUS_CODE_PATTERN, '')
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 1 && !isPlusCodeSegment(p));

  const filtered = parts
    .filter((p) => !TRAILING_COUNTRIES.has(p.toLowerCase()))
    .filter((p) => !venueNorm || p.trim().toLowerCase() !== venueNorm);

  if (filtered.length === 0) {
    const city = String(cityFallback || '').trim();
    if (!city || isPlusCodeSegment(city)) return '';
    if (venueNorm && city.toLowerCase() === venueNorm) return '';
    return titleCaseWords(city);
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
  const resolved = formatResolvedAreaLineFromGeocode(place);
  if (resolved) return resolved;

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

export function resolveEventAreaLine(input: {
  locationAddress?: string | null;
  locationName?: string | null;
  city?: string | null;
  mapAreaLine?: string | null;
}): string {
  const mapLine = String(input.mapAreaLine || '').trim();
  if (mapLine) return mapLine;

  const venueNorm = String(input.locationName || '').trim().toLowerCase();
  const cityRaw = String(input.city || '').trim();
  const cityFallback =
    cityRaw && cityRaw.toLowerCase() !== venueNorm ? cityRaw : null;

  const areaLine = parseAreaLineFromAddress(
    input.locationAddress,
    cityFallback,
    input.locationName,
  );

  if (!areaLine) return '';
  if (venueNorm && areaLine.toLowerCase() === venueNorm) return '';
  return areaLine;
}

export function formatEventLocationDisplay(event?: {
  locationName?: string | null;
  locationAddress?: string | null;
  city?: string | null;
  isOnline?: boolean;
  mapAreaLine?: string | null;
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
  const areaLine = resolveEventAreaLine({
    locationAddress: event.locationAddress,
    locationName: event.locationName,
    city: event.city,
    mapAreaLine: event.mapAreaLine,
  });

  return { venueLine, areaLine };
}

/** Stored on create when organizer picks a map pin (district/region/city only). */
export function formatMapAreaAddress(place?: GeocodePlace | null) {
  const line = formatAreaLineFromGeocode(place);
  return line || parseAreaLineFromAddress(null, place?.city);
}
