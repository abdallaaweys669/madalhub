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

const PLUS_CODE_PATTERN = /\b[2-9CFGHJMPQRVWX]{4,}\+[2-9CFGHJMPQRVWX]{2,}\b/gi;
const TRAILING_COUNTRIES = new Set(['somalia', 'kenya', 'ethiopia', 'djibouti', 'uganda']);
const MAJOR_CITIES = new Set([
  'mogadishu',
  'hargeisa',
  'kismayo',
  'bosaso',
  'garowe',
  'baidoa',
  'beledweyne',
  'marka',
  'burco',
  'burao',
]);
const DISTRICT_HINT = /degmada|district|ward|degaan|daerah|subregion|sub-region/i;

function isPlusCodeSegment(part) {
  const t = part.trim();
  if (!t) return true;
  return PLUS_CODE_PATTERN.test(t) || /^[A-Z0-9]{3,}\+[A-Z0-9]{2,}/i.test(t);
}

function splitLocationParts(raw) {
  return String(raw || '')
    .replace(PLUS_CODE_PATTERN, '')
    .replace(/\s*·\s*/g, ', ')
    .replace(/\s*[|–—]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim()
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 1 && !isPlusCodeSegment(p));
}

function findDistrictPart(parts) {
  return parts.find((part, index) => index > 0 && DISTRICT_HINT.test(part));
}

function pickReadableParts(parts, maxParts) {
  if (parts.length <= maxParts) return parts;

  let trimmed = parts;
  const last = trimmed[trimmed.length - 1].toLowerCase();
  if (TRAILING_COUNTRIES.has(last)) {
    trimmed = trimmed.slice(0, -1);
  }

  if (trimmed.length <= maxParts) return trimmed;

  const district = findDistrictPart(trimmed);
  if (district) {
    return [trimmed[0], district];
  }

  const second = trimmed[1];
  if (second && !MAJOR_CITIES.has(second.toLowerCase())) {
    return [trimmed[0], second];
  }

  const beforeCity = trimmed.find(
    (part, index) => index > 0 && !MAJOR_CITIES.has(part.toLowerCase()),
  );
  if (beforeCity) {
    return [trimmed[0], beforeCity];
  }

  return [trimmed[0], trimmed[trimmed.length - 1]];
}

function titleCaseWords(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Short, human-readable location for profile/home header (drops plus codes, keeps street + area).
 */
export function formatProfileLocationLabel(raw, { maxParts = 2, maxLength = 58 } = {}) {
  const source = String(raw || '').trim();
  if (!source) return '';

  let parts = [];
  if (source.includes('·')) {
    const [pinName, ...addressChunks] = source.split('·').map((chunk) => chunk.trim());
    const pinParts = splitLocationParts(pinName);
    const addressParts = splitLocationParts(addressChunks.join(' · '));
    const pinLabel = pinParts[0] || '';
    const district = findDistrictPart(addressParts);
    const area =
      district ||
      addressParts.find((part, index) => index > 0 && !MAJOR_CITIES.has(part.toLowerCase())) ||
      addressParts[0];

    if (pinLabel && area && pinLabel.toLowerCase() !== area.toLowerCase()) {
      parts = [pinLabel, area];
    } else if (pinLabel) {
      parts = [pinLabel, ...addressParts.filter((part) => part.toLowerCase() !== pinLabel.toLowerCase())];
    } else {
      parts = addressParts;
    }
  } else {
    parts = splitLocationParts(source);
  }

  if (parts.length === 0) {
    const fallback = source.replace(PLUS_CODE_PATTERN, '').replace(/\s*·\s*/g, ', ').trim();
    return fallback.length > maxLength ? `${fallback.slice(0, maxLength - 1).trim()}…` : fallback;
  }

  const trimmed = pickReadableParts(parts, maxParts);

  let label = trimmed
    .slice(0, maxParts)
    .map((part) => titleCaseWords(part))
    .join(', ');

  if (label.length > maxLength) {
    label = `${label.slice(0, maxLength - 1).trim()}…`;
  }
  return label;
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
export function pickLocationLabel(user, options) {
  if (!user) return '';
  const raw = resolveLocationFromObject(user);
  return formatProfileLocationLabel(raw, options);
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
    socialWebsite: firstNonEmpty(p.socialWebsite, p.social_website, d.socialWebsite, d.social_website),
    socialLinkedin: firstNonEmpty(p.socialLinkedin, p.social_linkedin, d.socialLinkedin, d.social_linkedin),
    socialInstagram: firstNonEmpty(p.socialInstagram, p.social_instagram, d.socialInstagram, d.social_instagram),
    socialFacebook: firstNonEmpty(p.socialFacebook, p.social_facebook, d.socialFacebook, d.social_facebook),
    socialTiktok: firstNonEmpty(p.socialTiktok, p.social_tiktok, d.socialTiktok, d.social_tiktok),
    createdAt: p.createdAt ?? p.created_at ?? d.createdAt ?? d.created_at,
    email: p.email ?? d.email ?? '',
  };

  return merged;
}
