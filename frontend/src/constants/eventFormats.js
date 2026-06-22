/** Event type (stored as events.event_format). */
export const EVENT_FORMAT_OPTIONS = [
  { key: 'meetup', label: 'Meetup', icon: 'people-outline', group: 'Simple' },
  { key: 'talk', label: 'Talk', icon: 'mic-outline', group: 'Simple' },
  { key: 'seminar', label: 'Seminar', icon: 'school-outline', group: 'Simple' },
  { key: 'workshop', label: 'Workshop', icon: 'construct-outline', group: 'Simple' },
  { key: 'panel', label: 'Panel', icon: 'chatbubbles-outline', group: 'Simple' },
  { key: 'bootcamp', label: 'Bootcamp', icon: 'fitness-outline', group: 'Simple' },
  { key: 'conference', label: 'Conference', icon: 'business-outline', group: 'Multi-session' },
  { key: 'summit', label: 'Summit', icon: 'trophy-outline', group: 'Multi-session' },
  { key: 'hackathon', label: 'Hackathon', icon: 'code-slash-outline', group: 'Multi-session' },
];

export const MULTI_SESSION_EVENT_FORMATS = new Set([
  'conference',
  'summit',
  'hackathon',
]);

export const SESSION_FORMAT_OPTIONS = [
  { key: 'keynote', label: 'Keynote' },
  { key: 'panel', label: 'Panel Discussion' },
  { key: 'presentation', label: 'Presentation' },
  { key: 'workshop', label: 'Workshop Session' },
  { key: 'fireside', label: 'Fireside Chat' },
  { key: 'roundtable', label: 'Roundtable' },
  { key: 'qa', label: 'Q&A Session' },
  { key: 'networking', label: 'Networking' },
  { key: 'demo', label: 'Product Demo' },
  { key: 'ceremony', label: 'Opening / Closing' },
];

export function isMultiSessionEventFormat(format) {
  return MULTI_SESSION_EVENT_FORMATS.has(String(format || '').toLowerCase());
}

/** Sample agenda for Conference / Summit (Phase 3 template). */
export function buildSampleAgendaSessions(eventStart, eventEnd) {
  const start = eventStart instanceof Date && Number.isFinite(eventStart.getTime())
    ? new Date(eventStart)
    : new Date();
  const end = eventEnd instanceof Date && Number.isFinite(eventEnd.getTime())
    ? new Date(eventEnd)
    : addHours(start, 6);

  const spanMs = Math.max(end.getTime() - start.getTime(), 3 * 60 * 60 * 1000);
  const blockMs = Math.floor(spanMs / 4);

  const titles = [
    'Opening & Welcome',
    'Keynote Session',
    'Panel Discussion',
    'Networking Break',
  ];
  const formats = ['ceremony', 'keynote', 'panel', 'networking'];

  return titles.map((title, index) => {
    const s = new Date(start.getTime() + blockMs * index);
    const e = new Date(start.getTime() + blockMs * (index + 1));
    return {
      key: `sample-${index}`,
      title,
      sessionFormat: formats[index],
      startDatetime: s,
      endDatetime: e,
      description: '',
      speakerNames: '',
      sortOrder: index,
    };
  });
}

function addHours(date, hours) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}
