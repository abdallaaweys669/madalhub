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
