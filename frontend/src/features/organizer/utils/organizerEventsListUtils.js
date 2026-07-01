import { EVENT_FORMAT_OPTIONS } from '@/constants/eventFormats';
import {
  filterOrganizerEventsByTab,
  isOrganizerEventLive,
  isOrganizerEventPast,
} from '@/features/organizer/utils/organizerEventUtils';

export const ORGANIZER_EVENT_TABS = [
  { id: 'Published', label: 'Published', icon: 'checkmark-circle-outline' },
  { id: 'Drafts', label: 'Drafts', icon: 'document-text-outline' },
  { id: 'Past', label: 'Past', icon: 'time-outline' },
];

export const EVENT_FILTER_STATUS_OPTIONS = [
  { id: 'all', label: 'Any status' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'live', label: 'Live now' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const EVENT_FILTER_DATE_OPTIONS = [
  { id: 'all', label: 'Any date' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'next30', label: 'Next 30 days' },
];

export const EVENT_FILTER_PRICING_OPTIONS = [
  { id: 'all', label: 'Any pricing' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
];

export const DEFAULT_ORGANIZER_EVENT_FILTERS = {
  status: 'all',
  eventType: 'all',
  date: 'all',
  categoryId: 'all',
  pricing: 'all',
};

export function createDefaultOrganizerEventFilters() {
  return { ...DEFAULT_ORGANIZER_EVENT_FILTERS };
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next.getTime();
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next.getTime();
}

function eventStartsAt(event) {
  const value = event?.startsAt ? new Date(event.startsAt).getTime() : NaN;
  return Number.isFinite(value) ? value : null;
}

function matchesDateFilter(event, dateFilter) {
  if (dateFilter === 'all') return true;
  const start = eventStartsAt(event);
  if (start == null) return dateFilter === 'all';

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (dateFilter === 'today') {
    return start >= todayStart && start <= todayEnd;
  }

  if (dateFilter === 'week') {
    const weekEnd = todayStart + 7 * 86400000;
    return start >= todayStart && start < weekEnd;
  }

  if (dateFilter === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    return start >= monthStart && start <= monthEnd;
  }

  if (dateFilter === 'next30') {
    return start >= Date.now() && start <= Date.now() + 30 * 86400000;
  }

  return true;
}

function matchesStatusFilter(event, statusFilter) {
  if (statusFilter === 'all') return true;
  if (statusFilter === 'cancelled') return event.status === 'cancelled';
  if (statusFilter === 'live') return isOrganizerEventLive(event);
  if (statusFilter === 'upcoming') {
    return (
      event.status === 'published' &&
      eventStartsAt(event) != null &&
      eventStartsAt(event) > Date.now()
    );
  }
  return true;
}

export function applyOrganizerEventFilters(events, filters, searchQuery = '') {
  const query = String(searchQuery ?? '').trim().toLowerCase();

  return events.filter((event) => {
    if (!matchesStatusFilter(event, filters.status)) return false;
    if (filters.eventType !== 'all' && String(event.eventFormat ?? '') !== filters.eventType) return false;
    if (
      filters.categoryId !== 'all' &&
      Number(event.interestId) !== Number(filters.categoryId)
    ) {
      return false;
    }
    if (filters.pricing === 'free' && Number(event.totalPrice) > 0) return false;
    if (filters.pricing === 'paid' && Number(event.totalPrice) <= 0) return false;
    if (!matchesDateFilter(event, filters.date)) return false;

    if (!query) return true;

    const haystack = [
      event.title,
      event.description,
      event.locationName,
      event.interestName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function filterOrganizerEventsForTab(events, activeTab, filters, searchQuery) {
  const tabbed = filterOrganizerEventsByTab(events, activeTab);
  return applyOrganizerEventFilters(tabbed, filters, searchQuery);
}

export function countActiveOrganizerEventFilters(filters) {
  return Object.entries(DEFAULT_ORGANIZER_EVENT_FILTERS).filter(
    ([key, defaultValue]) => filters?.[key] != null && filters[key] !== defaultValue,
  ).length;
}

export function buildOrganizerEventTypeOptions() {
  return [{ id: 'all', label: 'Any type' }, ...EVENT_FORMAT_OPTIONS.map((option) => ({
    id: option.key,
    label: option.label,
  }))];
}

export function buildOrganizerCategoryOptions(events, interests = []) {
  const fromInterests = interests.map((interest) => ({
    id: String(interest.id),
    label: interest.name,
  }));

  if (fromInterests.length) {
    return [{ id: 'all', label: 'Any category' }, ...fromInterests];
  }

  const seen = new Map();
  events.forEach((event) => {
    if (event.interestId != null && event.interestName) {
      seen.set(String(event.interestId), event.interestName);
    }
  });

  return [
    { id: 'all', label: 'Any category' },
    ...Array.from(seen.entries()).map(([id, label]) => ({ id, label })),
  ];
}

export function getOrganizerEventPricingLabel(event) {
  return Number(event?.totalPrice) > 0 ? 'Paid' : 'Free';
}

export function getOrganizerEventFormatLabel(event) {
  const key = String(event?.eventFormat ?? '').toLowerCase();
  return EVENT_FORMAT_OPTIONS.find((option) => option.key === key)?.label ?? null;
}
