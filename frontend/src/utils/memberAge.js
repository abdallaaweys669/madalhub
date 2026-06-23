export const MIN_MEMBER_AGE = 18;

export function getMaxBirthDateForMinimumAge(minAge = MIN_MEMBER_AGE) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setFullYear(date.getFullYear() - minAge);
  return date;
}

export function getMinBirthDate(maxYears = 120) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setFullYear(date.getFullYear() - maxYears);
  return date;
}

export function calculateAgeFromBirthDate(birthDate, asOf = new Date()) {
  if (!(birthDate instanceof Date) || Number.isNaN(birthDate.getTime())) {
    return null;
  }

  let age = asOf.getFullYear() - birthDate.getFullYear();
  const monthDiff = asOf.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function isAtLeastAge(birthDate, minAge = MIN_MEMBER_AGE) {
  const age = calculateAgeFromBirthDate(birthDate);
  return age != null && age >= minAge;
}

export function getMinimumAgeError(minAge = MIN_MEMBER_AGE) {
  return `You must be at least ${minAge} years old to use MadalHub.`;
}

export function formatDateOnly(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDobDisplay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 'Select your date of birth';
  }
  try {
    return date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return formatDateOnly(date);
  }
}
