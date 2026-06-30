export function shouldRequireFutureStart(startDate, endDate, loadedScheduleMs) {
  if (!loadedScheduleMs) return true;
  const startMs = startDate?.getTime?.();
  const endMs = endDate?.getTime?.();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return true;
  if (startMs === loadedScheduleMs.start && endMs === loadedScheduleMs.end) return false;
  return true;
}

/** Grace period so "now" picks aren't rejected while the user confirms. */
export const EVENT_SCHEDULE_MIN_LEAD_MS = 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameCalendarDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function formatScheduleTime(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatScheduleDay(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getEventScheduleMismatchIssues(
  startDate,
  endDate,
  { requireFutureStart = true } = {},
) {
  const startTime = startDate?.getTime?.();
  const endTime = endDate?.getTime?.();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return [];
  }

  const issues = [];
  const now = new Date();
  const cutoff = now.getTime() - EVENT_SCHEDULE_MIN_LEAD_MS;

  if (requireFutureStart && startTime < cutoff) {
    if (isSameCalendarDay(startDate, now)) {
      issues.push(
        `You picked ${formatScheduleTime(startDate)} today, but it's already ${formatScheduleTime(now)}. Choose a later start time.`,
      );
    } else if (startTime < startOfDay(now).getTime()) {
      issues.push(
        `You picked ${formatScheduleDay(startDate)}, which is already in the past. Choose today or a future date.`,
      );
    } else {
      issues.push('Start date and time must be in the future.');
    }
  }

  if (endTime <= startTime) {
    issues.push(
      `End time (${formatScheduleTime(endDate)}) must be after start (${formatScheduleTime(startDate)}).`,
    );
  }

  return issues;
}

export function getEventScheduleIssues(startDate, endDate, { requireFutureStart = true } = {}) {
  const startTime = startDate?.getTime?.();
  const endTime = endDate?.getTime?.();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return ['Tap start and end to set when your event runs.'];
  }

  return getEventScheduleMismatchIssues(startDate, endDate, { requireFutureStart });
}

/** Title + message for schedule AppPopup (publish / blocking flows). */
export function getScheduleWarningCopy(issues) {
  if (!issues?.length) {
    return { title: 'Check your event times', message: '', details: [] };
  }

  const [first, ...rest] = issues;
  let title = 'Check your event times';

  if (first.includes('already') && first.includes('today')) {
    title = 'That start time already passed';
  } else if (first.includes('in the past') && first.includes('picked')) {
    title = 'That date is in the past';
  } else if (first.includes('must be after start')) {
    title = 'End time is too early';
  } else if (first.includes('Tap start and end')) {
    title = 'Add your event schedule';
  }

  return {
    title,
    message: first,
    details: rest,
  };
}

export function isEventStartInPast(startDate) {
  const startTime = startDate?.getTime?.();
  if (!Number.isFinite(startTime)) return false;
  return startTime < Date.now() - EVENT_SCHEDULE_MIN_LEAD_MS;
}

/** Snap start to the next hour and end one hour later (used after rejecting a past pick). */
export function getDefaultSchedule() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return { start, end };
}
