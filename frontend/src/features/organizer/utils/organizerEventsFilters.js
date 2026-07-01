import {
  isOrganizerEventLive,
  isOrganizerEventPast,
} from '@/features/organizer/utils/organizerEventUtils';

export const EVENT_LIST_CHIPS = [
  { id: 'All', icon: 'grid-outline' },
  { id: 'Published', icon: 'checkmark-circle-outline' },
  { id: 'Drafts', icon: 'document-text-outline' },
  { id: 'Past', icon: 'time-outline' },
  { id: 'Archived', icon: 'archive-outline' },
];

export const EVENT_LIST_TABS = EVENT_LIST_CHIPS.map((chip) => chip.id);

export const EMPTY_EVENT_FILTERS = {
  status: 'all',
  eventType: 'all',
  date: 'all',
  categoryId: 'all',
  pricing: 'all',
};

export const EVENT_STATUS_FILTER_OPTIONS = [
  { id: 'all', label: 'Any status' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'live', label: 'Live' },
  { id: 'past', label: 'Past' },
  { id: 'draft', label: 'Draft' },
  { id: 'cancelled', label: 'Archived' },
];

export const EVENT_DATE_FILTER_OPTIONS = [
  { id: 'all', label: 'Any date' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
  { id: 'next_30_days', label: 'Next 30 days' },
];

export const EVENT_PRICING_FILTER_OPTIONS = [
  { id: 'all', label: 'Any price' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
];

function eventStartTime(event) {
  const start = event?.startsAt ? new Date(event.startsAt).getTime() : null;
  return Number.isFinite(start) ? start : null;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function matchesDateFilter(event, dateFilter) {
  if (!dateFilter || dateFilter === 'all') return true;
  const start = eventStartTime(event);
  if (start == null) return dateFilter === 'all';

  const now = new Date();
  const eventDate = new Date(start);

  if (dateFilter === 'today') return isSameDay(eventDate, now);

  if (dateFilter === 'this_week') {
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return start >= weekStart.getTime() && start < weekEnd.getTime();
  }

  if (dateFilter === 'this_month') {
    return (
      eventDate.getFullYear() === now.getFullYear() &&
      eventDate.getMonth() === now.getMonth()
    );
  }

  if (dateFilter === 'next_30_days') {
    const end = now.getTime() + 30 * 86400000;
    return start >= now.getTime() && start <= end;
  }

  return true;
}

function matchesStatusFilter(event, statusFilter) {
  if (!statusFilter || statusFilter === 'all') return true;
  if (statusFilter === 'draft') return event.status === 'draft';
  if (statusFilter === 'cancelled') return event.status === 'cancelled';
  if (statusFilter === 'upcoming') {
    return (
      event.status === 'published' &&
      eventStartTime(event) != null &&
      eventStartTime(event) > Date.now()
    );
  }
  if (statusFilter === 'live') return isOrganizerEventLive(event);
  if (statusFilter === 'past') {
    return event.status === 'published' && isOrganizerEventPast(event);
  }
  return true;
}

export function countActiveEventFilters(filters = EMPTY_EVENT_FILTERS) {
  return Object.entries(filters).filter(([, value]) => value && value !== 'all').length;
}

export function applyOrganizerEventFilters(events, filters = EMPTY_EVENT_FILTERS, searchQuery = '') {
  const query = String(searchQuery ?? '').trim().toLowerCase();

  return events.filter((event) => {
    if (query) {
      const haystack = [event.title, event.description, event.locationName, event.interestName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.eventType !== 'all') {
      if (String(event.eventFormat ?? '').toLowerCase() !== filters.eventType) return false;
    }

    if (filters.categoryId !== 'all') {
      if (Number(event.interestId) !== Number(filters.categoryId)) return false;
    }

    if (filters.pricing === 'free' && Number(event.totalPrice) > 0) return false;
    if (filters.pricing === 'paid' && Number(event.totalPrice) <= 0) return false;

    if (!matchesDateFilter(event, filters.date)) return false;
    if (!matchesStatusFilter(event, filters.status)) return false;

    return true;
  });
}
