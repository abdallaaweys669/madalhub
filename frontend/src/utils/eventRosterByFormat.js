import { formatKeyToDisplayLabel } from '@/constants/eventFormatLabels';
import { isMultiSessionEventFormat } from '@/constants/eventFormats';

/** @typedef {'speaker' | 'keynote' | 'panelist' | 'moderator'} RosterRole */

export const ROSTER_ROLE_OPTIONS = [
  { key: 'speaker', label: 'Speaker', icon: 'mic' },
  { key: 'keynote', label: 'Keynote speaker', icon: 'star' },
  { key: 'panelist', label: 'Panelist', icon: 'users' },
  { key: 'moderator', label: 'Moderator', icon: 'message-circle' },
];

const SPEAKER_ONLY_FORMATS = new Set(['meetup', 'talk', 'seminar', 'workshop', 'bootcamp']);

const ROLE_LABELS = {
  speaker: 'Speaker',
  keynote: 'Keynote',
  panelist: 'Panelist',
  moderator: 'Moderator',
};

function normalizeFormat(eventFormat) {
  return String(eventFormat || 'meetup').trim().toLowerCase();
}

function normalizeRole(role) {
  return String(role || 'speaker').trim().toLowerCase();
}

/**
 * @param {string | null | undefined} eventFormat
 * @returns {RosterRole[]}
 */
export function getAllowedRosterRoles(eventFormat) {
  const fmt = normalizeFormat(eventFormat);
  if (fmt === 'panel') return ['panelist', 'moderator'];
  if (isMultiSessionEventFormat(fmt)) return ['speaker', 'keynote', 'panelist', 'moderator'];
  if (SPEAKER_ONLY_FORMATS.has(fmt)) return ['speaker', 'keynote'];
  return ['speaker', 'keynote'];
}

/**
 * @param {string | null | undefined} eventFormat
 * @returns {RosterRole}
 */
export function getDefaultRosterRole(eventFormat) {
  const fmt = normalizeFormat(eventFormat);
  if (fmt === 'panel') return 'panelist';
  return 'speaker';
}

/**
 * @param {string | null | undefined} eventFormat
 */
export function getRosterSectionMeta(eventFormat) {
  const fmt = normalizeFormat(eventFormat);

  if (fmt === 'panel') {
    return {
      title: 'Panel lineup',
      helper: 'Add at least two panelists and one moderator before publishing.',
      addLabel: 'Add to panel',
      modalAddTitle: 'Add to panel',
      modalEditTitle: 'Edit panel member',
    };
  }

  if (isMultiSessionEventFormat(fmt)) {
    return {
      title: 'Featured lineup',
      helper: 'Add speakers, panelists, or moderators — their role shows on the event page.',
      addLabel: 'Add to lineup',
      modalAddTitle: 'Add to lineup',
      modalEditTitle: 'Edit lineup member',
    };
  }

  return {
    title: 'Speakers',
    helper: 'Add the people presenting at this event.',
    addLabel: 'Add speaker',
    modalAddTitle: 'Add speaker',
    modalEditTitle: 'Edit speaker',
  };
}

/**
 * @param {Array<{ role?: string }> | null | undefined} roster
 * @param {string | null | undefined} eventFormat
 */
export function filterRosterByFormat(roster, eventFormat) {
  const allowed = new Set(getAllowedRosterRoles(eventFormat));
  return (roster || []).filter((person) => allowed.has(normalizeRole(person?.role)));
}

/**
 * @param {Array<{ role?: string, fullName?: string }>} people
 * @param {string | null | undefined} eventFormat
 */
export function getRosterFormatMismatchIssues(eventFormat, people) {
  const fmt = normalizeFormat(eventFormat);
  const allowed = new Set(getAllowedRosterRoles(eventFormat));
  const mismatched = (people || []).filter(
    (person) => person.fullName?.trim() && !allowed.has(normalizeRole(person.role)),
  );

  if (!mismatched.length) return [];

  const formatLabel = formatKeyToDisplayLabel(fmt) || 'event';

  if (fmt === 'panel') {
    return ['Panel events use panelists and moderators only — remove speakers or change the event type.'];
  }

  if (isMultiSessionEventFormat(fmt)) {
    return [];
  }

  return [
    `${formatLabel} events use speakers only — remove panelists/moderators or change the event type to Panel or Conference.`,
  ];
}

/**
 * @param {Array<Record<string, unknown>> | null | undefined} roster
 * @param {string | null | undefined} eventFormat
 * @returns {Array<{ title: string, roster: Array<Record<string, unknown>>, showRole?: boolean }>}
 */
export function groupRosterForDisplay(roster, eventFormat) {
  const fmt = normalizeFormat(eventFormat);
  const filtered = filterRosterByFormat(roster, eventFormat);

  if (!filtered.length) return [];

  if (fmt === 'panel') {
    /** @type {Array<{ title: string, roster: typeof filtered, showRole?: boolean }>} */
    const groups = [];
    const moderators = filtered.filter((person) => normalizeRole(person.role) === 'moderator');
    const panelists = filtered.filter((person) => normalizeRole(person.role) === 'panelist');

    if (moderators.length) {
      groups.push({ title: 'Moderator', roster: moderators, showRole: false });
    }
    if (panelists.length) {
      groups.push({ title: 'Panelists', roster: panelists, showRole: false });
    }

    return groups.length ? groups : [{ title: 'Panel lineup', roster: filtered, showRole: false }];
  }

  if (isMultiSessionEventFormat(fmt)) {
    return [{ title: 'Featured lineup', roster: filtered, showRole: true }];
  }

  return [{ title: 'Speakers', roster: filtered, showRole: false }];
}

export function formatRosterRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] || formatKeyToDisplayLabel(role) || 'Guest';
}
