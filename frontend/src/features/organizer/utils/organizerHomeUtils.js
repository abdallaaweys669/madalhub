function hasText(value) {
  return Boolean(String(value ?? '').trim());
}

/** Rough profile completion for the home dashboard ring. */
export function computeOrganizerProfileCompletion(profile) {
  if (!profile) return 0;

  const checks = [
    hasText(profile.organizationName),
    hasText(profile.organizationDescription),
    hasText(profile.profileImg),
    hasText(profile.location),
    hasText(profile.website),
    hasText(profile.instagram) || hasText(profile.facebook),
  ];

  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function formatOrganizerMemberSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Local-time greeting for the organizer home header. */
export function getTimeGreeting(now = new Date()) {
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return { text: 'Good morning', emoji: '☀️' };
  }
  if (hour >= 12 && hour < 17) {
    return { text: 'Good afternoon', emoji: '👋' };
  }
  if (hour >= 17 && hour < 22) {
    return { text: 'Good evening', emoji: '🌇' };
  }
  return { text: 'Good night', emoji: '🌙' };
}
