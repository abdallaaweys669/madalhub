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

export function sortOrganizerEvents(events) {
  return [...events].sort((a, b) => {
    if (a.status === 'draft' && b.status !== 'draft') return 1;
    if (a.status !== 'draft' && b.status === 'draft') return -1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });
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
  if (activeTab === 'Past') {
    return events.filter((e) => {
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
