import { resolveApiAssetUrl } from '@/utils/mediaUrl';

export function organizerInitials(name) {
  if (!name || typeof name !== 'string') return 'O';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function formatOrganizerDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function formatOrganizerDateTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function formatEventMeta(event) {
  const online = event?.isPhysical ? 'In-person' : 'Online';
  const price = Number(event?.totalPrice) > 0 ? `$${event.totalPrice}` : 'Free';
  return `${online} • ${price}`;
}

export function resolveOrganizerEventCoverUrl(event) {
  const raw =
    event?.coverImage ??
    event?.image ??
    event?.coverImageUrl ??
    event?.cover_image ??
    event?.cover?.url ??
    event?.cover?.path ??
    event?.image?.uri ??
    null;

  if (typeof raw !== 'string' || !raw.trim()) return null;
  return resolveApiAssetUrl(raw.trim().replace(/\\/g, '/')) || raw.trim();
}

export function organizerEventStatusChip(event) {
  if (event?.status === 'cancelled') {
    return { label: 'Archived', bg: '#F1F5F9', fg: '#64748B' };
  }
  if (event?.status === 'draft') return { label: 'Draft', bg: '#EEF2FF', fg: '#4F46E5' };

  const start = event?.startsAt ? new Date(event.startsAt).getTime() : null;
  const end = event?.endsAt ? new Date(event.endsAt).getTime() : null;
  const now = Date.now();

  if (end && now > end) {
    return { label: 'Past', bg: '#F3F4F6', fg: '#374151' };
  }
  if (!end && start && now > start + 86400000) {
    return { label: 'Past', bg: '#F3F4F6', fg: '#374151' };
  }

  if (start && start > now) {
    const ms = start - now;
    const days = Math.ceil(ms / 86400000);
    return {
      label: days <= 2 ? `In ${days} day${days > 1 ? 's' : ''}` : 'Upcoming',
      bg: '#FFEDE3',
      fg: '#FF7B3F',
    };
  }
  return { label: 'Live', bg: '#E8F6EE', fg: '#0D9A58' };
}

export function organizerEventNewestSortKey(event) {
  if (event?.createdAt) {
    const created = new Date(event.createdAt).getTime();
    if (Number.isFinite(created)) return created;
  }
  const id = Number(event?.id);
  if (Number.isFinite(id)) return id;
  const start = event?.startsAt ? new Date(event.startsAt).getTime() : 0;
  return Number.isFinite(start) ? start : 0;
}

export function isOrganizerEventUpcoming(event) {
  if (event?.status !== 'published') return false;
  if (isOrganizerEventPast(event) || isOrganizerEventLive(event)) return false;
  const start = event?.startsAt ? new Date(event.startsAt).getTime() : null;
  return start != null && start > Date.now();
}

/** List sort priority: live → upcoming → draft → past → archived */
export function getOrganizerEventListSortTier(event) {
  if (isOrganizerEventLive(event)) return 0;
  if (isOrganizerEventUpcoming(event)) return 1;
  if (event?.status === 'draft') return 2;
  if (event?.status === 'cancelled') return 4;
  if (isOrganizerEventPast(event)) return 3;
  return 5;
}

export function compareOrganizerEventsForList(a, b) {
  const tierDiff = getOrganizerEventListSortTier(a) - getOrganizerEventListSortTier(b);
  if (tierDiff !== 0) return tierDiff;
  return organizerEventNewestSortKey(b) - organizerEventNewestSortKey(a);
}

export function sortOrganizerEvents(events) {
  return [...events].sort(compareOrganizerEventsForList);
}

export function filterOrganizerEventsByTab(events, activeTab) {
  if (activeTab === 'All') return events;
  if (activeTab === 'Drafts') return events.filter((e) => e.status === 'draft');
  if (activeTab === 'Published') {
    return events.filter((e) => {
      if (e.status !== 'published') return false;
      const end = e.endsAt ? new Date(e.endsAt).getTime() : null;
      const start = e.startsAt ? new Date(e.startsAt).getTime() : null;
      const now = Date.now();
      if (end && now > end) return false;
      if (!end && start && now > start + 86400000) return false;
      return true;
    });
  }
  if (activeTab === 'Archived') {
    return events.filter((e) => e.status === 'cancelled');
  }
  if (activeTab === 'Past') {
    return events.filter((e) => {
      if (e.status === 'cancelled') return false;
      const end = e.endsAt ? new Date(e.endsAt).getTime() : null;
      const start = e.startsAt ? new Date(e.startsAt).getTime() : null;
      const now = Date.now();
      if (end && now > end) return true;
      if (!end && start && now > start + 86400000) return true;
      return false;
    });
  }
  return events;
}

export function computeOrganizerMetrics(events) {
  const totalAttendees = events.reduce((sum, event) => sum + Number(event.registrationCount ?? 0), 0);
  const upcomingCount = events.filter(
    (event) => event.status === 'published' && new Date(event.startsAt).getTime() > Date.now(),
  ).length;
  const draftCount = events.filter((event) => event.status === 'draft').length;
  const nearestUpcomingEvent =
    events
      .filter(
        (event) => event.status === 'published' && new Date(event.startsAt).getTime() > Date.now(),
      )
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] ?? null;

  return { totalAttendees, upcomingCount, draftCount, nearestUpcomingEvent };
}

export function getUpcomingOrganizerEvents(events, limit = 3) {
  return events
    .filter(
      (event) => event.status === 'published' && new Date(event.startsAt).getTime() > Date.now(),
    )
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, limit);
}

export function countUpcomingOrganizerEvents(events) {
  return events.filter(
    (event) => event.status === 'published' && new Date(event.startsAt).getTime() > Date.now(),
  ).length;
}

export function isOrganizerEventPast(event) {
  if (event?.status !== 'published') return false;
  const end = event?.endsAt ? new Date(event.endsAt).getTime() : null;
  const start = event?.startsAt ? new Date(event.startsAt).getTime() : null;
  const now = Date.now();
  if (end && now > end) return true;
  if (!end && start && now > start + 86400000) return true;
  return false;
}

export function isOrganizerEventLive(event) {
  if (event?.status !== 'published') return false;
  if (isOrganizerEventPast(event)) return false;
  const start = event?.startsAt ? new Date(event.startsAt).getTime() : null;
  if (start && start > Date.now()) return false;
  return true;
}

export function computeOrganizerOverviewCounts(events) {
  const totalAttendees = events.reduce(
    (sum, event) => sum + Number(event.registrationCount ?? 0),
    0,
  );

  return {
    eventsCount: events.length,
    totalAttendees,
    upcoming: countUpcomingOrganizerEvents(events),
    drafts: events.filter((event) => event.status === 'draft').length,
    live: events.filter((event) => isOrganizerEventLive(event)).length,
    past: events.filter((event) => isOrganizerEventPast(event)).length,
  };
}

export const OVERVIEW_PERIOD_OPTIONS = [
  { id: 'all', label: 'All time' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
  { id: '30d', label: 'Last 30 days' },
];

function eventStartsAtTime(event) {
  const start = event?.startsAt ? new Date(event.startsAt).getTime() : null;
  return Number.isFinite(start) ? start : null;
}

export function filterEventsByOverviewPeriod(events, period = 'all') {
  if (!period || period === 'all') return events;

  const now = Date.now();
  const today = new Date();

  if (period === 'month') {
    const rangeStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const rangeEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    return events.filter((event) => {
      const start = eventStartsAtTime(event);
      return start != null && start >= rangeStart && start <= rangeEnd;
    });
  }

  if (period === 'year') {
    const rangeStart = new Date(today.getFullYear(), 0, 1).getTime();
    const rangeEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
    return events.filter((event) => {
      const start = eventStartsAtTime(event);
      return start != null && start >= rangeStart && start <= rangeEnd;
    });
  }

  if (period === '30d') {
    const rangeStart = now - 30 * 86400000;
    return events.filter((event) => {
      const start = eventStartsAtTime(event);
      return start != null && start >= rangeStart && start <= now;
    });
  }

  return events;
}

export function getOverviewPeriodLabel(period = 'all') {
  return OVERVIEW_PERIOD_OPTIONS.find((option) => option.id === period)?.label ?? 'All time';
}

export function getOrganizerNextUpEvents(events, limit = 6) {
  const upcoming = events
    .filter(
      (event) => event.status === 'published' && new Date(event.startsAt).getTime() > Date.now(),
    )
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  if (upcoming.length > 0) {
    return upcoming.slice(0, limit);
  }

  return events
    .filter((event) => event.status === 'draft')
    .sort((a, b) => {
      const aTime = eventStartsAtTime(a) ?? 0;
      const bTime = eventStartsAtTime(b) ?? 0;
      if (aTime !== bTime) return aTime - bTime;
      return String(a.title ?? '').localeCompare(String(b.title ?? ''));
    })
    .slice(0, limit);
}

export function countOrganizerNextUpEvents(events) {
  const upcoming = events.filter(
    (event) => event.status === 'published' && new Date(event.startsAt).getTime() > Date.now(),
  ).length;
  if (upcoming > 0) return upcoming;
  return events.filter((event) => event.status === 'draft').length;
}

export function formatOrganizerDayMonth(iso) {
  if (!iso) return { day: '--', month: '---' };
  try {
    const date = new Date(iso);
    return {
      day: date.toLocaleDateString(undefined, { day: 'numeric' }),
      month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    };
  } catch {
    return { day: '--', month: '---' };
  }
}
