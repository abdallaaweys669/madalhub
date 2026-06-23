import { BadRequestException } from '@nestjs/common';

export const MIN_MEMBER_AGE = 18;

export function parseDobInput(value: string | Date): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException('Invalid date of birth');
    }
    return value;
  }

  const trimmed = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new BadRequestException('Date of birth must be YYYY-MM-DD');
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    throw new BadRequestException('Invalid date of birth');
  }

  return parsed;
}

export function calculateAgeFromBirthDate(
  birthDate: Date,
  asOf: Date = new Date(),
): number {
  let age = asOf.getFullYear() - birthDate.getFullYear();
  const monthDiff = asOf.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && asOf.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function assertMinimumMemberAge(
  dob: Date,
  minAge: number = MIN_MEMBER_AGE,
): void {
  if (calculateAgeFromBirthDate(dob) < minAge) {
    throw new BadRequestException(
      `You must be at least ${minAge} years old to use MadalHub.`,
    );
  }
}
