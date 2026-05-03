import apiClient from './client';
import { resolveApiAssetUrl } from '../utils/mediaUrl';

/** In-memory list cache for instant paint (stale-while-revalidate). */
const EVENTS_LIST_CACHE_TTL_MS = 60 * 1000;
const eventsListCache = Object.create(null);

function stableParamsKey(params) {
  const p = params && typeof params === 'object' ? params : {};
  const sorted = Object.keys(p)
    .sort()
    .reduce((acc, k) => {
      acc[k] = p[k];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

export function peekEventsListCache(params) {
  const key = stableParamsKey(params);
  const entry = eventsListCache[key];
  if (!entry) return null;
  if (Date.now() - entry.at > EVENTS_LIST_CACHE_TTL_MS) return null;
  return { items: entry.items, meta: entry.meta };
}

export function invalidateEventsListCache() {
  Object.keys(eventsListCache).forEach((k) => {
    delete eventsListCache[k];
  });
}

/** Fallback when `coverGradient` is missing — matches theme primary orange. */
export const DEFAULT_COVER_GRADIENT = ['#FF7B3F', '#FF9A3D'];

/** Per-interest warm gradients (brand-first; still visually distinct). */
const INTEREST_GRADIENTS = {
  1: ['#FF7B3F', '#FFB38A'],
  2: ['#F97316', '#FDBA74'],
  3: ['#EA580C', '#FDBA74'],
  4: ['#FB923C', '#FFE4CC'],
  5: ['#FF8C42', '#FFD6B8'],
  6: ['#F97316', '#FFEDD5'],
  7: ['#FF7B3F', '#FFE8DC'],
};

function normalizeInterestId(event) {
  const raw = event?.interestId;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = Number(raw || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeOrganizerName(event) {
  const direct =
    event?.organizer?.name ||
    event?.organizerName ||
    event?.organizationName ||
    event?.organizer_profile?.organizationName;

  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  return '';
}

function deriveInitials(sourceText, fallbackText = 'OR') {
  const primary = typeof sourceText === 'string' ? sourceText.trim() : '';
  const fallback = typeof fallbackText === 'string' ? fallbackText.trim() : 'OR';
  const raw = primary || fallback || 'OR';
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase();
}

function pickCoverLetter(event, title) {
  const organizer = normalizeOrganizerName(event);
  if (organizer) {
    return organizer.slice(0, 1);
  }

  const cleaned = String(title || '')
    .replace(/^[^a-zA-Z0-9]+/g, '')
    .trim();

  return cleaned.slice(0, 1) || '?';
}

function gradientForEvent(event) {
  const interestId = normalizeInterestId(event);
  if (interestId && INTEREST_GRADIENTS[interestId]) {
    return INTEREST_GRADIENTS[interestId];
  }

  const seedSource =
    normalizeOrganizerName(event) ||
    String(event?.title || '') ||
    String(event?.id || '') ||
    'kulan';

  let hash = 0;
  for (let i = 0; i < seedSource.length; i += 1) {
    hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0;
  }

  const baseHue = 24;
  const hueSpread = 22;
  const hue = baseHue + (hash % (hueSpread + 1));
  const hue2 = Math.min(42, hue + 10);
  const start = `hsl(${hue}, 92%, 54%)`;
  const end = `hsl(${hue2}, 88%, 62%)`;
  return [start, end];
}

function resolveCoverFields(event, title) {
  const rawImage = event?.image;
  if (typeof rawImage === 'string' && rawImage.trim()) {
    const resolvedCoverImage = resolveApiAssetUrl(rawImage.trim()) || rawImage.trim();
    return {
      coverImageUrl: resolvedCoverImage,
      coverLetter: pickCoverLetter(event, title),
      coverGradient: gradientForEvent(event),
      image: { uri: resolvedCoverImage },
    };
  }

  const gradient = gradientForEvent(event);
  return {
    coverImageUrl: null,
    coverLetter: pickCoverLetter(event, title),
    coverGradient: gradient,
    image: null,
  };
}

function formatEventDetails(startDate, city, isOnline) {
  const datePart = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart} · ${isOnline ? 'Online' : city || 'Venue TBD'}`;
}

export function mapApiEventToCard(event) {
  const startDate = new Date(event.startsAt ?? event?.datetime?.start ?? Date.now());
  const city = event.city ?? event?.location?.name ?? '';
  const isOnline =
    typeof event.isOnline === 'boolean'
      ? event.isOnline
      : String(city).toLowerCase() === 'online';

  const title = event.title ?? 'Untitled event';
  const cover = resolveCoverFields(event, title);

  const attendeePreviews = Array.isArray(event.attendeePreviews)
    ? event.attendeePreviews
        .filter(Boolean)
        .slice(0, 3)
        .map((row) => {
          const userId = Number(row.userId ?? row.id ?? 0) || null;
          const name = typeof row.name === 'string' && row.name.trim() ? row.name.trim() : 'Member';
          const rawAvatar = row.avatar ?? row.profileImg ?? row.profile_img ?? null;
          const avatarUrl =
            typeof rawAvatar === 'string' && rawAvatar.trim()
              ? resolveApiAssetUrl(rawAvatar.trim())
              : null;
          return { userId, name, avatarUrl };
        })
    : [];

  const organizerNameRaw = event?.organizer?.name ?? event?.organizerName ?? '';
  const organizerDescriptionRaw =
    event?.organizer?.description ?? event?.organizer?.bio ?? event?.organizerDescription ?? '';
  const organizerAvatarRaw = event?.organizer?.avatar ?? event?.organizerLogo ?? null;
  const organizerName =
    typeof organizerNameRaw === 'string' && organizerNameRaw.trim() ? organizerNameRaw.trim() : '';
  const organizerDescription =
    typeof organizerDescriptionRaw === 'string' && organizerDescriptionRaw.trim()
      ? organizerDescriptionRaw.trim()
      : '';
  const organizerLogoUrl =
    typeof organizerAvatarRaw === 'string' && organizerAvatarRaw.trim()
      ? resolveApiAssetUrl(organizerAvatarRaw.trim())
      : null;
  const organizerInitials = deriveInitials(organizerName, event?.title ?? 'OR');
  const sponsors = Array.isArray(event?.sponsors)
    ? event.sponsors
        .map((row) => {
          const rawLogo = row?.logo ?? row?.sponsorLogo ?? null;
          const logoUrl =
            typeof rawLogo === 'string' && rawLogo.trim() ? resolveApiAssetUrl(rawLogo.trim()) : null;
          return {
            id: row?.id != null ? String(row.id) : null,
            name: typeof row?.name === 'string' && row.name.trim() ? row.name.trim() : '',
            logoUrl,
          };
        })
        .filter((row) => row.id)
    : [];

  return {
    id: String(event.id),
    interestId:
      typeof event.interestId === 'number'
        ? event.interestId
        : Number(event.interestId || 0) || null,
    title,
    description: event.description ?? '',
    details: formatEventDetails(startDate, city, isOnline),
    coverImageUrl: cover.coverImageUrl,
    coverLetter: cover.coverLetter,
    coverGradient: cover.coverGradient,
    image: cover.image,
    attendeePreviews,
    organizerName,
    organizerDescription,
    organizerLogoUrl,
    organizerInitials,
    sponsors,
    goingCount: event.goingCount ?? event.attendeesCount ?? 0,
    isSaved: Boolean(event.isSaved),
    isJoined: Boolean(event.isJoined ?? event.joined),
    startsAt: startDate.toISOString(),
    city,
    isOnline,
    priceType: event.priceType ?? ((event.priceAmount ?? event.price ?? 0) > 0 ? 'Paid' : 'Free'),
    priceAmount:
      event.priceAmount ?? (typeof event.price === 'number' && event.price > 0 ? event.price : null),
  };
}

export async function getEvents(params = {}) {
  const response = await apiClient.get('/events', { params });
  const payload = response.data;
  const items = Array.isArray(payload) ? payload : payload?.items ?? [];
  const meta = Array.isArray(payload)
    ? null
    : {
        page: payload?.page ?? 1,
        limit: payload?.limit ?? items.length,
        total: payload?.total ?? items.length,
        hasMore: Boolean(payload?.hasMore),
      };
  const mapped = items.map(mapApiEventToCard);
  const result = { items: mapped, meta };
  eventsListCache[stableParamsKey(params)] = { items: mapped, meta, at: Date.now() };
  return result;
}

export async function getEventById(id) {
  const response = await apiClient.get(`/events/${id}`);
  return mapApiEventToCard(response.data);
}

export async function getEventAttendees(id, params = {}) {
  const response = await apiClient.get(`/events/${id}/attendees`, { params });
  const payload = response.data ?? {};
  const items = Array.isArray(payload.items) ? payload.items : [];
  return {
    items: items.map((row) => {
      const rawAvatar = row?.avatar ?? row?.profileImg ?? row?.profile_img ?? null;
      return {
        id: Number(row?.id ?? 0) || null,
        name: typeof row?.name === 'string' && row.name.trim() ? row.name.trim() : 'Member',
        avatarUrl:
          typeof rawAvatar === 'string' && rawAvatar.trim()
            ? resolveApiAssetUrl(rawAvatar.trim())
            : null,
        joinedAt: row?.joinedAt ?? null,
      };
    }),
    page: payload.page ?? 1,
    limit: payload.limit ?? items.length,
    total: payload.total ?? items.length,
    hasMore: Boolean(payload.hasMore),
  };
}

export async function joinEvent(id) {
  const response = await apiClient.post(`/events/${id}/join`);
  invalidateEventsListCache();
  return response.data;
}

export async function leaveEvent(id) {
  const response = await apiClient.delete(`/events/${id}/join`);
  invalidateEventsListCache();
  return response.data;
}

export async function saveEvent(id) {
  const response = await apiClient.post(`/events/${id}/save`);
  invalidateEventsListCache();
  return response.data;
}

export async function unsaveEvent(id) {
  const response = await apiClient.delete(`/events/${id}/save`);
  invalidateEventsListCache();
  return response.data;
}

export async function getSavedEvents() {
  const response = await apiClient.get('/events/saved/list');
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(mapApiEventToCard);
}

export async function getEventInterests() {
  const response = await apiClient.get('/events/interests');
  return Array.isArray(response.data?.interests) ? response.data.interests : [];
}
