/** @typedef {'website' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok'} SocialLinkKey */

/**
 * @typedef {Object} SocialLinkField
 * @property {SocialLinkKey} key
 * @property {string} apiKey
 * @property {string} label
 * @property {string} placeholder
 * @property {string} brandColor
 * @property {'Feather' | 'FontAwesome5'} iconPack
 * @property {string} iconName
 * @property {boolean} [brand]
 */

/** @type {SocialLinkField[]} */
export const SPEAKER_SOCIAL_LINK_FIELDS = [
  {
    key: 'website',
    apiKey: 'social_website',
    label: 'Website',
    placeholder: 'yoursite.com',
    brandColor: '#FF7A00',
    iconPack: 'Feather',
    iconName: 'globe',
  },
  {
    key: 'linkedin',
    apiKey: 'social_linkedin',
    label: 'LinkedIn',
    placeholder: 'username',
    brandColor: '#0A66C2',
    iconPack: 'FontAwesome5',
    iconName: 'linkedin',
    brand: true,
  },
  {
    key: 'instagram',
    apiKey: 'social_instagram',
    label: 'Instagram',
    placeholder: '@username',
    brandColor: '#E4405F',
    iconPack: 'FontAwesome5',
    iconName: 'instagram',
    brand: true,
  },
  {
    key: 'facebook',
    apiKey: 'social_facebook',
    label: 'Facebook',
    placeholder: 'username',
    brandColor: '#1877F2',
    iconPack: 'FontAwesome5',
    iconName: 'facebook',
    brand: true,
  },
  {
    key: 'tiktok',
    apiKey: 'social_tiktok',
    label: 'TikTok',
    placeholder: '@username',
    brandColor: '#010101',
    iconPack: 'FontAwesome5',
    iconName: 'tiktok',
    brand: true,
  },
];

/** @type {SocialLinkField[]} */
export const SOCIAL_LINK_FIELDS = [
  {
    key: 'website',
    apiKey: 'social_website',
    label: 'Website',
    placeholder: 'https://your-site.com',
    brandColor: '#FF7A00',
    iconPack: 'Feather',
    iconName: 'globe',
  },
  {
    key: 'linkedin',
    apiKey: 'social_linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/username',
    brandColor: '#0A66C2',
    iconPack: 'FontAwesome5',
    iconName: 'linkedin',
    brand: true,
  },
  {
    key: 'instagram',
    apiKey: 'social_instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/username',
    brandColor: '#E4405F',
    iconPack: 'FontAwesome5',
    iconName: 'instagram',
    brand: true,
  },
  {
    key: 'facebook',
    apiKey: 'social_facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/username',
    brandColor: '#1877F2',
    iconPack: 'FontAwesome5',
    iconName: 'facebook',
    brand: true,
  },
  {
    key: 'tiktok',
    apiKey: 'social_tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@username',
    brandColor: '#010101',
    iconPack: 'FontAwesome5',
    iconName: 'tiktok',
    brand: true,
  },
];

const CAMEL_BY_KEY = {
  website: ['socialWebsite', 'social_website'],
  linkedin: ['socialLinkedin', 'social_linkedin'],
  instagram: ['socialInstagram', 'social_instagram'],
  facebook: ['socialFacebook', 'social_facebook'],
  tiktok: ['socialTiktok', 'social_tiktok'],
};

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;
    const trimmed = String(value).trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function stripLeadingAt(value) {
  return String(value ?? '').trim().replace(/^@+/, '');
}

const SPEAKER_USERNAME_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;

/**
 * Turn organizer username input into a stored/openable URL (speakers only).
 * Still accepts pasted full URLs for backward compatibility.
 * @param {SocialLinkKey} key
 * @param {string} raw
 * @returns {string}
 */
export function normalizeSpeakerSocialInput(key, raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';

  const looksLikeUrl =
    /^https?:\/\//i.test(trimmed) ||
    /^www\./i.test(trimmed) ||
    (key === 'website' && trimmed.includes('.') && !trimmed.includes(' '));

  if (looksLikeUrl) {
    return normalizeSocialLinkInput(trimmed);
  }

  const handle = stripLeadingAt(trimmed);
  if (!handle) return '';

  switch (key) {
    case 'linkedin':
      return `https://linkedin.com/in/${handle}`;
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'tiktok':
      return `https://tiktok.com/@${handle}`;
    case 'website':
      return normalizeSocialLinkInput(trimmed);
    default:
      return '';
  }
}

/**
 * Convert a stored URL back to simple username text for the speaker edit form.
 * @param {SocialLinkKey} key
 * @param {string} stored
 * @returns {string}
 */
export function storedSocialToSpeakerInput(key, stored) {
  const trimmed = String(stored ?? '').trim();
  if (!trimmed) return '';

  if (key === 'website') {
    return formatSocialLinkDisplay(trimmed);
  }

  const tryParsePath = () => {
    try {
      const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`;
      const url = new URL(withScheme);
      return url.pathname.replace(/^\/+|\/+$/g, '');
    } catch {
      return '';
    }
  };

  const path = tryParsePath();
  if (path) {
    switch (key) {
      case 'linkedin': {
        const match = path.match(/^(?:in\/)?([^/?#]+)/i);
        return match?.[1] ?? stripLeadingAt(trimmed);
      }
      case 'instagram': {
        const match = path.match(/^([^/?#]+)/);
        return match?.[1] ? `@${stripLeadingAt(match[1])}` : stripLeadingAt(trimmed);
      }
      case 'facebook': {
        const match = path.match(/^([^/?#]+)/);
        return match?.[1] ?? stripLeadingAt(trimmed);
      }
      case 'tiktok': {
        const match = path.match(/^@?([^/?#]+)/);
        return match?.[1] ? `@${stripLeadingAt(match[1])}` : stripLeadingAt(trimmed);
      }
      default:
        break;
    }
  }

  return key === 'instagram' || key === 'tiktok'
    ? (trimmed.startsWith('@') ? trimmed : `@${stripLeadingAt(trimmed)}`)
    : stripLeadingAt(trimmed);
}

/**
 * @param {Record<string, unknown> | null | undefined} user
 * @returns {Record<SocialLinkKey, string>}
 */
export function pickSocialLinkValues(user) {
  /** @type {Record<SocialLinkKey, string>} */
  const values = {
    website: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  };

  for (const field of SOCIAL_LINK_FIELDS) {
    const [camel, snake] = CAMEL_BY_KEY[field.key];
    values[field.key] = firstNonEmpty(user?.[camel], user?.[snake]);
  }

  return values;
}

/**
 * Trim and add https:// when the user omitted a scheme.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeSocialLinkInput(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * @param {Record<SocialLinkKey, string>} values
 * @returns {Record<string, string | undefined>}
 */
export function buildSocialLinksPayload(values) {
  /** @type {Record<string, string>} */
  const payload = {};

  for (const field of SOCIAL_LINK_FIELDS) {
    const normalized = normalizeSocialLinkInput(values[field.key]);
    payload[field.apiKey] = normalized;
  }

  return payload;
}

/**
 * @param {string} url
 * @returns {string}
 */
export function formatSocialLinkDisplay(url) {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return '';

  return trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

/**
 * @param {Record<string, unknown> | null | undefined} user
 * @returns {Array<SocialLinkField & { url: string; displayUrl: string }>}
 */
export function getFilledSocialLinks(user) {
  const values = pickSocialLinkValues(user);

  return SOCIAL_LINK_FIELDS.filter((field) => values[field.key]).map((field) => {
    const url = normalizeSocialLinkInput(values[field.key]);
    return {
      ...field,
      url,
      displayUrl: formatSocialLinkDisplay(url),
    };
  });
}

/**
 * @param {string} url
 * @returns {string}
 */
export function toOpenableUrl(url) {
  const normalized = normalizeSocialLinkInput(url);
  if (!normalized) return '';
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized}`;
}

/**
 * @param {Record<SocialLinkKey, string>} values
 * @returns {string | null}
 */
export function getSocialLinksValidationError(values) {
  for (const field of SOCIAL_LINK_FIELDS) {
    const raw = String(values[field.key] ?? '').trim();
    if (!raw) continue;

    const normalized = normalizeSocialLinkInput(raw);
    if (!/^https?:\/\/.+/i.test(normalized)) {
      return `Enter a valid ${field.label} link (include a domain or full URL).`;
    }
  }

  return null;
}

/** @returns {Record<SocialLinkKey, string>} */
export function getEmptySocialLinkValues() {
  return {
    website: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  };
}

const SPEAKER_ROSTER_ROLES = new Set(['speaker', 'keynote']);

export function isSpeakerRosterRole(role) {
  return SPEAKER_ROSTER_ROLES.has(String(role || '').trim().toLowerCase());
}

/**
 * @param {Record<string, unknown> | null | undefined} person
 * @returns {Record<SocialLinkKey, string>}
 */
export function pickRosterSocialLinkValues(person) {
  return pickSocialLinkValues({
    socialWebsite: person?.socialWebsite,
    social_website: person?.social_website,
    socialLinkedin: person?.socialLinkedin,
    social_linkedin: person?.social_linkedin,
    socialInstagram: person?.socialInstagram,
    social_instagram: person?.social_instagram,
    socialFacebook: person?.socialFacebook,
    social_facebook: person?.social_facebook,
    socialTiktok: person?.socialTiktok,
    social_tiktok: person?.social_tiktok,
  });
}

/**
 * Stored roster URLs → username-style values for the speaker edit form.
 * @param {Record<string, unknown> | null | undefined} person
 * @returns {Record<SocialLinkKey, string>}
 */
export function pickRosterSpeakerSocialInputs(person) {
  const stored = pickRosterSocialLinkValues(person);
  /** @type {Record<SocialLinkKey, string>} */
  const inputs = getEmptySocialLinkValues();

  for (const field of SPEAKER_SOCIAL_LINK_FIELDS) {
    inputs[field.key] = storedSocialToSpeakerInput(field.key, stored[field.key]);
  }

  return inputs;
}

/**
 * @param {Record<string, unknown> | null | undefined} person
 */
export function getFilledSocialLinksFromRecord(person) {
  const values = pickRosterSocialLinkValues(person);

  return SOCIAL_LINK_FIELDS.filter((field) => values[field.key]).map((field) => {
    const url = normalizeSocialLinkInput(values[field.key]);
    return {
      ...field,
      url,
      displayUrl: formatSocialLinkDisplay(url),
    };
  });
}

/**
 * @param {Record<SocialLinkKey, string>} values
 */
export function buildRosterSocialLinksPayload(values) {
  const payload = buildSocialLinksPayload(values);
  return {
    socialWebsite: payload.social_website || null,
    socialLinkedin: payload.social_linkedin || null,
    socialInstagram: payload.social_instagram || null,
    socialFacebook: payload.social_facebook || null,
    socialTiktok: payload.social_tiktok || null,
  };
}

/**
 * @param {Record<SocialLinkKey, string>} values
 * @returns {string | null}
 */
export function getSpeakerSocialLinksValidationError(values) {
  for (const field of SPEAKER_SOCIAL_LINK_FIELDS) {
    const raw = String(values[field.key] ?? '').trim();
    if (!raw) continue;

    if (field.key === 'website') {
      const normalized = normalizeSpeakerSocialInput('website', raw);
      if (!/^https?:\/\/.+/i.test(normalized)) {
        return 'Enter a valid website (e.g. yoursite.com).';
      }
      continue;
    }

    const handle = stripLeadingAt(raw);
    if (!SPEAKER_USERNAME_PATTERN.test(handle)) {
      return `Enter a valid ${field.label} username (letters, numbers, . _ - only).`;
    }
  }

  return null;
}

/**
 * Speaker form usernames → full URLs for the API.
 * @param {Record<SocialLinkKey, string>} values
 */
export function buildSpeakerRosterSocialLinksPayload(values) {
  /** @type {Record<string, string | null>} */
  const out = {
    socialWebsite: null,
    socialLinkedin: null,
    socialInstagram: null,
    socialFacebook: null,
    socialTiktok: null,
  };

  for (const field of SPEAKER_SOCIAL_LINK_FIELDS) {
    const normalized = normalizeSpeakerSocialInput(field.key, values[field.key]);
    const camelKey = field.key === 'website'
      ? 'socialWebsite'
      : `social${field.key.charAt(0).toUpperCase()}${field.key.slice(1)}`;
    out[camelKey] = normalized || null;
  }

  return out;
}

/** @type {SocialLinkField[]} */
export const ORGANIZER_SOCIAL_EDIT_FIELDS = SPEAKER_SOCIAL_LINK_FIELDS.filter(
  (field) => field.key === 'instagram' || field.key === 'facebook',
);

/**
 * Stored organizer profile URLs → username-style values for the edit form.
 * @param {Record<string, unknown> | null | undefined} profile
 * @returns {{ instagram: string; facebook: string }}
 */
export function pickOrganizerSocialInputs(profile) {
  return {
    instagram: storedSocialToSpeakerInput('instagram', profile?.instagram),
    facebook: storedSocialToSpeakerInput('facebook', profile?.facebook),
  };
}

/**
 * Organizer edit form → API payload (full URLs).
 * @param {{ instagram?: string; facebook?: string }} values
 */
export function buildOrganizerSocialPayload(values) {
  const payload = buildSpeakerRosterSocialLinksPayload({
    ...getEmptySocialLinkValues(),
    instagram: values.instagram ?? '',
    facebook: values.facebook ?? '',
  });

  return {
    instagram: payload.socialInstagram,
    facebook: payload.socialFacebook,
  };
}

/**
 * @param {{ instagram?: string; facebook?: string }} values
 * @returns {string | null}
 */
export function getOrganizerSocialLinksValidationError(values) {
  return getSpeakerSocialLinksValidationError({
    ...getEmptySocialLinkValues(),
    instagram: values.instagram ?? '',
    facebook: values.facebook ?? '',
  });
}

/**
 * @param {Record<string, unknown> | null | undefined} profile
 * @returns {Array<SocialLinkField & { url: string; displayUrl: string }>}
 */
export function getFilledOrganizerSocialLinks(profile) {
  return ORGANIZER_SOCIAL_EDIT_FIELDS.filter((field) =>
    String(profile?.[field.key] ?? '').trim(),
  ).map((field) => {
    const url = normalizeSocialLinkInput(String(profile[field.key]).trim());
    return {
      ...field,
      url,
      displayUrl: formatSocialLinkDisplay(url),
    };
  });
}
