import apiClient from './client';
import { resolveApiAssetUrl } from '../utils/mediaUrl';

/** In-memory list cache for instant paint (stale-while-revalidate). */
const EVENTS_LIST_CACHE_TTL_MS = 60 * 1000;
const eventsListCache = Object.create(null);
const INTEREST_LABELS_CACHE_TTL_MS = 10 * 60 * 1000;
let interestLabelsByIdCache = null;
let interestLabelsLoadedAt = 0;
let interestLabelsInFlightPromise = null;
const organizerNameByEventIdCache = Object.create(null);
const organizerNameInFlightByEventId = Object.create(null);
const ORGANIZER_ENRICH_LIMIT = 8;

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

const META_SEPARATOR = '\n---\n[KULAN_EVENT_META]\n';
const META_END = '\n[/KULAN_EVENT_META]';

function stripEmbeddedEventMeta(rawDescription) {
  if (typeof rawDescription !== 'string' || !rawDescription.trim()) return '';
  const start = rawDescription.indexOf(META_SEPARATOR);
  if (start === -1) {
    return rawDescription.trim();
  }

  const end = rawDescription.indexOf(META_END, start + META_SEPARATOR.length);
  const visiblePart =
    end === -1
      ? rawDescription.slice(0, start)
      : `${rawDescription.slice(0, start)}${rawDescription.slice(end + META_END.length)}`;
  return visiblePart.trim();
}

function normalizeInterestId(event) {
  const raw = event?.interestId;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = Number(raw || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeOrganizerName(event) {
  const direct =
    event?.organizer?.name ||
    event?.organizer?.organizationName ||
    event?.organizer?.organization?.name ||
    event?.organizerName ||
    event?.organizationName ||
    event?.organizer_profile?.organizationName ||
    event?.organizerProfile?.organizationName ||
    event?.hostName ||
    event?.host?.name ||
    event?.creator?.name ||
    event?.createdBy?.name ||
    event?.user?.fullName ||
    event?.user?.name;

  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  return '';
}

async function getOrganizerNameForEventId(eventId) {
  const id = String(eventId || '').trim();
  if (!id) return '';

  if (typeof organizerNameByEventIdCache[id] === 'string') {
    return organizerNameByEventIdCache[id];
  }

  if (organizerNameInFlightByEventId[id]) {
    return organizerNameInFlightByEventId[id];
  }

  organizerNameInFlightByEventId[id] = (async () => {
    try {
      const response = await apiClient.get(`/events/${id}`);
      const organizerName = normalizeOrganizerName(response?.data);
      organizerNameByEventIdCache[id] = organizerName || '';
      return organizerName || '';
    } catch {
      organizerNameByEventIdCache[id] = '';
      return '';
    } finally {
      delete organizerNameInFlightByEventId[id];
    }
  })();

  return organizerNameInFlightByEventId[id];
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

function parseDateSafe(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatTimeForStatus(dateValue) {
  const d = parseDateSafe(dateValue);
  if (!d) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isRegistrationClosed(event) {
  if (!event || typeof event !== 'object') return false;
  if (event.isRegistrationClosed === true || event.registrationClosed === true) return true;

  const status = String(event.registrationStatus ?? event.status ?? '')
    .trim()
    .toLowerCase();
  if (status === 'closed' || status === 'registration-closed') return true;

  const closesAt = parseDateSafe(
    event.registrationClosesAt ?? event.registrationDeadline ?? event.registrationEndAt ?? null,
  );
  if (closesAt && new Date() > closesAt) return true;

  return false;
}

function deriveEventState(event, goingCount, capacity, startsAtIso) {
  const start = parseDateSafe(startsAtIso);
  if (!start) {
    return {
      state: 'upcoming',
      statusChip: { label: 'Upcoming', variant: 'neutral' },
      statusLine: null,
      registrationLabel: null,
      canJoin: true,
      canWaitlist: false,
    };
  }

  const now = new Date();
  const end = parseDateSafe(event?.endsAt ?? event?.endDatetime ?? null);
  const capacityNum = typeof capacity === 'number' && capacity > 0 ? capacity : null;
  const seatsLeft = capacityNum != null ? capacityNum - (goingCount ?? 0) : null;
  const dynamicFewSeatsThreshold =
    capacityNum != null ? Math.max(3, Math.ceil(capacityNum * 0.1)) : null;

  if (isRegistrationClosed(event) && start > now) {
    return {
      state: 'closed',
      statusChip: { label: 'Closed', variant: 'closed' },
      statusLine: null,
      registrationLabel: 'Registration closed',
      canJoin: false,
      canWaitlist: false,
    };
  }

  if (end && now > end) {
    return {
      state: 'ended',
      statusChip: { label: 'Ended', variant: 'ended' },
      statusLine: null,
      registrationLabel: 'Ended',
      canJoin: false,
      canWaitlist: false,
    };
  }
  if (seatsLeft != null && seatsLeft <= 0) {
    return {
      state: 'fully-booked',
      statusChip: { label: 'Fully booked', variant: 'sold-out' },
      statusLine: null,
      registrationLabel: 'Fully booked',
      canJoin: false,
      canWaitlist: true,
    };
  }

  // Treat as live only while inside time window; without an end date, cap live window at 6h.
  if (start <= now) {
    if (end && now <= end) {
      const endLabel = formatTimeForStatus(end);
      return {
        state: 'live',
        statusChip: { label: 'Live', variant: 'live' },
        statusLine: endLabel ? `Happening now · ends ${endLabel}` : 'Happening now',
        registrationLabel: null,
        canJoin: true,
        canWaitlist: false,
      };
    }
    if (!end) {
      const elapsedMs = now.getTime() - start.getTime();
      const liveFallbackWindowMs = 6 * 60 * 60 * 1000;
      if (elapsedMs <= liveFallbackWindowMs) {
        return {
          state: 'live',
          statusChip: { label: 'Live', variant: 'live' },
          statusLine: 'Happening now',
          registrationLabel: null,
          canJoin: true,
          canWaitlist: false,
        };
      }
      return {
        state: 'ended',
        statusChip: { label: 'Ended', variant: 'ended' },
        statusLine: null,
        registrationLabel: 'Ended',
        canJoin: false,
        canWaitlist: false,
      };
    }
  }

  const msUntilStart = start.getTime() - now.getTime();
  const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

  if (
    seatsLeft != null &&
    dynamicFewSeatsThreshold != null &&
    seatsLeft > 0 &&
    seatsLeft <= dynamicFewSeatsThreshold
  ) {
    return {
      state: 'upcoming',
      statusChip: { label: 'Few seats', variant: 'urgent' },
      statusLine: null,
      registrationLabel: `${seatsLeft} seats left`,
      canJoin: true,
      canWaitlist: false,
    };
  }
  if (isSameCalendarDay(start, now)) {
    return {
      state: 'upcoming',
      statusChip: { label: 'Today', variant: 'today' },
      statusLine: null,
      registrationLabel: seatsLeft != null ? `${seatsLeft} seats left` : null,
      canJoin: true,
      canWaitlist: false,
    };
  }

  return {
    state: 'upcoming',
    statusChip: { label: 'Upcoming', variant: 'neutral' },
    statusLine: null,
    registrationLabel: seatsLeft != null ? `${seatsLeft} seats left` : null,
    canJoin: true,
    canWaitlist: false,
  };
}

function deriveUrgencyLabel(startsAtIso) {
  if (!startsAtIso) return null;

  const now = new Date();
  const start = parseDateSafe(startsAtIso);
  if (!start) return null;

  if (start <= now) return null;

  const msUntilStart = start.getTime() - now.getTime();
  const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

  if (hoursUntilStart < 1) {
    const mins = Math.max(1, Math.round(msUntilStart / (1000 * 60)));
    return `Starts in ${mins}m`;
  }

  if (hoursUntilStart < 2) return 'Starts in 1h';
  if (hoursUntilStart < 24) return `Starts in ${Math.round(hoursUntilStart)}h`;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfter = new Date(startOfToday);
  startOfDayAfter.setDate(startOfDayAfter.getDate() + 2);

  if (start < startOfDayAfter) return 'Tomorrow';

  const daysLeft = Math.ceil(msUntilStart / (1000 * 60 * 60 * 24));
  if (daysLeft <= 7) return `${daysLeft}d left`;
  return null;
}

function deriveDiscoverySignals(args) {
  const { eventState, goingCount, startsAtIso } = args;
  const start = parseDateSafe(startsAtIso);
  if (!start) return [];

  const now = new Date();
  const msUntilStart = start.getTime() - now.getTime();
  const startsInHours = msUntilStart / (1000 * 60 * 60);
  const isStartingSoon = startsInHours > 0 && startsInHours <= 24;
  const isTrendingNow =
    eventState === 'live' ||
    (eventState !== 'closed' && typeof goingCount === 'number' && goingCount >= 10);

  const signals = [];
  if (isTrendingNow) {
    signals.push({ key: 'trending', label: 'Trending now', tone: 'hot' });
  }
  if (isStartingSoon && eventState !== 'live') {
    signals.push({ key: 'starting-soon', label: 'Starting soon', tone: 'soon' });
  }
  return signals.slice(0, 2);
}

function normalizeCategoryName(event) {
  const direct =
    event?.interestName ??
    event?.interest?.name ??
    event?.categoryName ??
    event?.category?.name ??
    null;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  const interestId = normalizeInterestId(event);
  if (!interestId || !interestLabelsByIdCache) return null;
  const byId = interestLabelsByIdCache[interestId];
  return typeof byId === 'string' && byId.trim() ? byId.trim() : null;
}

/** Normalize event format key from GET /events/:id or list payloads (handles naming quirks). */
function pickEventFormatFromPayload(event) {
  const candidates = [
    event?.eventFormat,
    event?.event_format,
    event?.formatType,
    event?.format_type,
    typeof event?.format === 'string' ? event.format : null,
    event?.meta?.eventFormat,
  ];
  for (const c of candidates) {
    if (c == null) continue;
    const s = typeof c === 'number' ? String(c) : String(c).trim();
    if (s) return s;
  }
  return null;
}

function normalizeCoordinate(raw) {
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function pickEventLocationCoordinates(event) {
  const latitude = normalizeCoordinate(
    event?.locationLatitude ??
      event?.location_latitude ??
      event?.latitude ??
      event?.location?.latitude ??
      event?.location?.lat,
  );
  const longitude = normalizeCoordinate(
    event?.locationLongitude ??
      event?.location_longitude ??
      event?.longitude ??
      event?.location?.longitude ??
      event?.location?.lng,
  );

  return {
    latitude,
    longitude,
    hasCoordinates: latitude != null && longitude != null,
  };
}

async function ensureInterestLabelsLoaded() {
  if (
    interestLabelsByIdCache &&
    Date.now() - interestLabelsLoadedAt < INTEREST_LABELS_CACHE_TTL_MS
  ) {
    return interestLabelsByIdCache;
  }
  if (interestLabelsInFlightPromise) return interestLabelsInFlightPromise;

  interestLabelsInFlightPromise = (async () => {
    try {
      const response = await apiClient.get('/events/interests');
      const interests = Array.isArray(response.data?.interests) ? response.data.interests : [];
      interestLabelsByIdCache = interests.reduce((acc, row) => {
        const id = Number(row?.id);
        const name = typeof row?.name === 'string' ? row.name.trim() : '';
        if (Number.isFinite(id) && id > 0 && name) {
          acc[id] = name;
        }
        return acc;
      }, {});
      interestLabelsLoadedAt = Date.now();
    } catch {
      if (!interestLabelsByIdCache) {
        interestLabelsByIdCache = {};
      }
    } finally {
      interestLabelsInFlightPromise = null;
    }
    return interestLabelsByIdCache;
  })();

  return interestLabelsInFlightPromise;
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
    hour12: true,
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

  const organizerNameRaw = normalizeOrganizerName(event);
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

  const goingCount = event.goingCount ?? event.attendeesCount ?? 0;
  const capacity = event.capacity ?? null;
  const startsAtIso = startDate.toISOString();
  const eventState = deriveEventState(event, goingCount, capacity, startsAtIso);
  const urgencyLabel = deriveUrgencyLabel(startsAtIso);
  const discoverySignals = deriveDiscoverySignals({
    eventState: eventState.state,
    goingCount,
    startsAtIso,
  });
  const interestId =
    typeof event.interestId === 'number'
      ? event.interestId
      : Number(event.interestId || 0) || null;
  const categoryName = normalizeCategoryName(event);

  const rawOrganizerId = event?.organizerId;
  const organizerId =
    rawOrganizerId != null && Number.isFinite(Number(rawOrganizerId)) ? Number(rawOrganizerId) : null;

  const resolvedFormat = pickEventFormatFromPayload(event);
  const locationCoordinates = pickEventLocationCoordinates(event);

  return {
    id: String(event.id),
    organizerId,
    interestId,
    title,
    description: stripEmbeddedEventMeta(event.description ?? ''),
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
    goingCount,
    capacity,
    isSaved: Boolean(event.isSaved),
    isJoined: Boolean(event.isJoined ?? event.joined),
    startsAt: startsAtIso,
    endsAt: event.endsAt ?? event?.endDatetime ?? null,
    city,
    locationName:
      typeof event.locationName === 'string' && event.locationName.trim()
        ? event.locationName.trim()
        : city,
    locationAddress:
      typeof event.locationAddress === 'string' && event.locationAddress.trim()
        ? event.locationAddress.trim()
        : typeof event?.location?.address === 'string' && event.location.address.trim()
          ? event.location.address.trim()
          : '',
    locationLatitude: locationCoordinates.latitude,
    locationLongitude: locationCoordinates.longitude,
    hasLocationPin: locationCoordinates.hasCoordinates,
    isOnline,
    eventFormat: resolvedFormat,
    roster: Array.isArray(event.roster)
      ? event.roster.map((r) => ({
          id: r.id,
          role: r.role,
          displayName: r.displayName,
          title: r.title,
          photoUrl: r.photoUrl,
          sortOrder: r.sortOrder,
        }))
      : [],
    priceType: event.priceType ?? ((event.priceAmount ?? event.price ?? 0) > 0 ? 'Paid' : 'Free'),
    priceAmount:
      event.priceAmount ?? (typeof event.price === 'number' && event.price > 0 ? event.price : null),
    statusChip: eventState.statusChip,
    eventState: eventState.state,
    statusLine: eventState.statusLine,
    registrationLabel: eventState.registrationLabel,
    canJoin: eventState.canJoin,
    canWaitlist: eventState.canWaitlist,
    discoverySignals,
    urgencyLabel,
    categoryName,
  };
}

export async function getEvents(params = {}) {
  await ensureInterestLabelsLoaded();
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
  const missingOrganizerRows = mapped
    .filter((row) => !row.organizerName || !String(row.organizerName).trim())
    .slice(0, ORGANIZER_ENRICH_LIMIT);

  if (missingOrganizerRows.length > 0) {
    const organizerNames = await Promise.all(
      missingOrganizerRows.map((row) => getOrganizerNameForEventId(row.id)),
    );
    const byId = missingOrganizerRows.reduce((acc, row, idx) => {
      const name = organizerNames[idx];
      if (typeof name === 'string' && name.trim()) {
        acc[String(row.id)] = name.trim();
      }
      return acc;
    }, {});
    mapped.forEach((row) => {
      const resolved = byId[String(row.id)];
      if (resolved && (!row.organizerName || !String(row.organizerName).trim())) {
        row.organizerName = resolved;
      }
    });
  }

  const result = { items: mapped, meta };
  eventsListCache[stableParamsKey(params)] = { items: mapped, meta, at: Date.now() };
  return result;
}

export async function getEventById(id) {
  await ensureInterestLabelsLoaded();
  const response = await apiClient.get(`/events/${id}`);
  const raw = response.data?.data ?? response.data;
  return mapApiEventToCard(raw);
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
  await ensureInterestLabelsLoaded();
  const response = await apiClient.get('/events/saved/list');
  const items = Array.isArray(response.data) ? response.data : [];
  return items.map(mapApiEventToCard);
}

export async function getEventInterests() {
  const response = await apiClient.get('/events/interests');
  const interests = Array.isArray(response.data?.interests) ? response.data.interests : [];
  interestLabelsByIdCache = interests.reduce((acc, row) => {
    const id = Number(row?.id);
    const name = typeof row?.name === 'string' ? row.name.trim() : '';
    if (Number.isFinite(id) && id > 0 && name) {
      acc[id] = name;
    }
    return acc;
  }, {});
  interestLabelsLoadedAt = Date.now();
  return interests;
}

/** Organizer (role 2): create draft event */
export async function createOrganizerEvent(body) {
  const response = await apiClient.post('/events', body);
  invalidateEventsListCache();
  return response.data;
}

/** Organizer: update draft / published fields */
export async function patchOrganizerEvent(id, body) {
  const response = await apiClient.patch(`/events/${id}`, body);
  invalidateEventsListCache();
  return response.data;
}

/** Organizer: publish draft (`PATCH /events/publish/:id` on backend) */
export async function publishOrganizerEvent(id) {
  const response = await apiClient.patch(`/events/publish/${id}`);
  invalidateEventsListCache();
  return response.data;
}
