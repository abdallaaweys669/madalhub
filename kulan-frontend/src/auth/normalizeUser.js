/**
 * Profile visibility from API (MySQL tinyint / JSON) may be 0, 1, true, false.
 */
export function coerceProfileVisibilityBool(value, defaultWhenUnset = true) {
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === null || value === undefined) return defaultWhenUnset;
  return Boolean(value);
}

function firstNonEmpty(...candidates) {
  for (const v of candidates) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return '';
}

/** Display name for headers and cards (supports API camelCase or snake_case). */
export function pickDisplayName(user) {
  if (!user) return '';
  const fromName = firstNonEmpty(user.fullName, user.full_name, user.name, user.firstName);
  if (fromName) return fromName;
  const email = typeof user.email === 'string' ? user.email.trim() : '';
  if (email.includes('@')) return email.split('@')[0];
  return '';
}

/** Resolve location from API/user object (camelCase, snake_case, or alternate keys). */
function resolveLocationFromObject(obj) {
  if (!obj || typeof obj !== 'object') return '';
  return firstNonEmpty(
    obj.location,
    obj.user_location,
    obj.userLocation,
    obj.location_name,
    obj.locationName,
    obj.locationText,
    obj.home_city,
    obj.homeCity,
    obj.city,
    obj.address,
    obj.region,
    obj.country,
  );
}

/** City / region line for profile card and profile screen. */
export function pickLocationLabel(user) {
  if (!user) return '';
  return resolveLocationFromObject(user);
}

function pickVisibility(profile, decoded, camelKey, snakeKey) {
  const p = profile || {};
  const d = decoded || {};
  const rawP = p[camelKey] !== undefined ? p[camelKey] : p[snakeKey];
  if (rawP !== undefined && rawP !== null) return coerceProfileVisibilityBool(rawP, true);
  const rawD = d[camelKey] !== undefined ? d[camelKey] : d[snakeKey];
  if (rawD !== undefined && rawD !== null) return coerceProfileVisibilityBool(rawD, true);
  return true;
}

/**
 * Merge JWT payload (decoded) with GET /auth/me profile into one client user shape.
 */
export function normalizeUser(decodedUser = {}, profile = null) {
  const p = profile || {};
  const d = decodedUser || {};

  const fullName = firstNonEmpty(
    p.fullName,
    p.full_name,
    p.name,
    d.fullName,
    d.full_name,
    d.name,
    d.firstName,
  );

  const location = firstNonEmpty(resolveLocationFromObject(p), resolveLocationFromObject(d));

  const phone = firstNonEmpty(p.phone, p.phoneNumber, d.phone, d.phoneNumber);

  const profileImg = p.profileImg ?? p.profile_img ?? d.profileImg ?? d.profile_img ?? null;

  const merged = {
    ...d,
    ...p,
    id: p.id != null ? Number(p.id) : d.id != null ? Number(d.id) : d.sub != null ? Number(d.sub) : undefined,
    fullName: fullName || '',
    location: location || '',
    phone: phone || '',
    profileImg,
    avatarUrl: profileImg,
    profileShowEmail: pickVisibility(p, d, 'profileShowEmail', 'profile_show_email'),
    profileShowPhone: pickVisibility(p, d, 'profileShowPhone', 'profile_show_phone'),
    profileHidden: coerceProfileVisibilityBool(
      p.profileHidden ?? p.profile_hidden ?? d.profileHidden ?? d.profile_hidden,
      false,
    ),
    createdAt: p.createdAt ?? p.created_at ?? d.createdAt ?? d.created_at,
    email: p.email ?? d.email ?? '',
  };

  return merged;
}
