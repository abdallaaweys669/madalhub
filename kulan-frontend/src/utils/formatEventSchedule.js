function parseEventDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function sameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatSingleDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * @param {string | Date} startsAt
 * @param {string | Date | null | undefined} endsAt
 */
export function formatEventDateLabel(startsAt, endsAt) {
  const start = startsAt instanceof Date ? startsAt : parseEventDate(startsAt);
  if (!start) return '';

  const end = endsAt instanceof Date ? endsAt : parseEventDate(endsAt);
  if (!end || end.getTime() <= start.getTime() || sameCalendarDay(start, end)) {
    return formatSingleDate(start);
  }

  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  const weekday = start.toLocaleDateString('en-US', { weekday: 'short' });
  const month = start.toLocaleDateString('en-US', { month: 'short' });

  if (startYear === endYear && startMonth === endMonth) {
    return `${weekday}, ${month} ${start.getDate()}-${end.getDate()}, ${startYear}`;
  }

  const startPart = formatSingleDate(start);
  if (startYear === endYear) {
    const endPart = end.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return `${startPart} – ${endPart}, ${startYear}`;
  }

  const endPart = end.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startPart}, ${startYear} – ${endPart}`;
}

/**
 * @param {string | Date} startsAt
 * @param {string | Date | null | undefined} endsAt
 */
export function formatEventTimeLabel(startsAt, endsAt) {
  const start = startsAt instanceof Date ? startsAt : parseEventDate(startsAt);
  if (!start) return '';

  const startTime = formatTime(start);
  const end = endsAt instanceof Date ? endsAt : parseEventDate(endsAt);
  if (!end || end.getTime() <= start.getTime()) {
    return startTime;
  }

  const endTime = formatTime(end);
  if (startTime === endTime && sameCalendarDay(start, end)) {
    return startTime;
  }

  return `${startTime} - ${endTime}`;
}

/**
 * @param {string | Date} startsAt
 * @param {string | Date | null | undefined} endsAt
 */
export function formatEventScheduleLabels(startsAt, endsAt) {
  const start = startsAt instanceof Date ? startsAt : parseEventDate(startsAt);
  const end = endsAt instanceof Date ? endsAt : parseEventDate(endsAt);
  const dateLabel = formatEventDateLabel(start ?? startsAt, end ?? endsAt);
  const timeLabel = start ? formatEventTimeLabel(start, end) : '';
  const dateTimeLabel = [dateLabel, timeLabel].filter(Boolean).join(' · ');
  return { dateLabel, timeLabel, dateTimeLabel };
}
