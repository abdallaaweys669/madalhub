export const ORGANIZER_REPORT_TYPES = {
  overview: {
    key: 'overview',
    label: 'Overview',
    title: 'Overview',
    icon: 'pie-chart',
    description: 'Account snapshot — events, drafts, and audience totals.',
  },
  events: {
    key: 'events',
    label: 'Events',
    title: 'Events report',
    icon: 'calendar',
    description: 'All events with status, schedule, and registration counts.',
  },
  registrations: {
    key: 'registrations',
    label: 'Registrations',
    title: 'Registrations report',
    icon: 'user-plus',
    description: 'Member sign-ups across your events.',
  },
  attendance: {
    key: 'attendance',
    label: 'Attendance',
    title: 'Attendance report',
    icon: 'check-circle',
    description: 'Check-ins vs registrations by event.',
  },
  'top-events': {
    key: 'top-events',
    label: 'Top events',
    title: 'Top events report',
    icon: 'trending-up',
    description: 'Best-performing events by registration count.',
  },
};

export const ORGANIZER_REPORT_MENU = [
  ORGANIZER_REPORT_TYPES.overview,
  ORGANIZER_REPORT_TYPES.events,
  ORGANIZER_REPORT_TYPES.registrations,
  ORGANIZER_REPORT_TYPES.attendance,
  ORGANIZER_REPORT_TYPES['top-events'],
];

export function getOrganizerReportHref(type) {
  return `/(organizer)/reports/${type}`;
}

export function resolveOrganizerReportMeta(type) {
  return ORGANIZER_REPORT_TYPES[type] ?? {
    key: type,
    label: 'Report',
    title: 'Report',
    icon: 'file-text',
    description: '',
  };
}
