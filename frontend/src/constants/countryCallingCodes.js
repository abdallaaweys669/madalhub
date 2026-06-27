/** ISO 3166-1 alpha-2 → flag emoji */
export function isoToFlag(iso) {
  if (!iso || iso.length !== 2) return '🏳️';
  return iso
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

/**
 * Curated list — East Africa first, then alphabetical by name.
 * dialCode is digits only (no +).
 */
export const COUNTRY_CALLING_CODES = [
  { iso: 'SO', name: 'Somalia', dialCode: '252' },
  { iso: 'KE', name: 'Kenya', dialCode: '254' },
  { iso: 'ET', name: 'Ethiopia', dialCode: '251' },
  { iso: 'DJ', name: 'Djibouti', dialCode: '253' },
  { iso: 'UG', name: 'Uganda', dialCode: '256' },
  { iso: 'TZ', name: 'Tanzania', dialCode: '255' },
  { iso: 'RW', name: 'Rwanda', dialCode: '250' },
  { iso: 'SS', name: 'South Sudan', dialCode: '211' },
  { iso: 'SD', name: 'Sudan', dialCode: '249' },
  { iso: 'ER', name: 'Eritrea', dialCode: '291' },
  { iso: 'AE', name: 'United Arab Emirates', dialCode: '971' },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '966' },
  { iso: 'QA', name: 'Qatar', dialCode: '974' },
  { iso: 'GB', name: 'United Kingdom', dialCode: '44' },
  { iso: 'US', name: 'United States', dialCode: '1' },
  { iso: 'CA', name: 'Canada', dialCode: '1' },
  { iso: 'AF', name: 'Afghanistan', dialCode: '93' },
  { iso: 'AL', name: 'Albania', dialCode: '355' },
  { iso: 'DZ', name: 'Algeria', dialCode: '213' },
  { iso: 'AR', name: 'Argentina', dialCode: '54' },
  { iso: 'AU', name: 'Australia', dialCode: '61' },
  { iso: 'AT', name: 'Austria', dialCode: '43' },
  { iso: 'BH', name: 'Bahrain', dialCode: '973' },
  { iso: 'BD', name: 'Bangladesh', dialCode: '880' },
  { iso: 'BE', name: 'Belgium', dialCode: '32' },
  { iso: 'BJ', name: 'Benin', dialCode: '229' },
  { iso: 'BR', name: 'Brazil', dialCode: '55' },
  { iso: 'BF', name: 'Burkina Faso', dialCode: '226' },
  { iso: 'BI', name: 'Burundi', dialCode: '257' },
  { iso: 'CM', name: 'Cameroon', dialCode: '237' },
  { iso: 'CN', name: 'China', dialCode: '86' },
  { iso: 'CG', name: 'Congo', dialCode: '242' },
  { iso: 'CD', name: 'Congo (DRC)', dialCode: '243' },
  { iso: 'CI', name: "Côte d'Ivoire", dialCode: '225' },
  { iso: 'EG', name: 'Egypt', dialCode: '20' },
  { iso: 'FR', name: 'France', dialCode: '33' },
  { iso: 'DE', name: 'Germany', dialCode: '49' },
  { iso: 'GH', name: 'Ghana', dialCode: '233' },
  { iso: 'IN', name: 'India', dialCode: '91' },
  { iso: 'ID', name: 'Indonesia', dialCode: '62' },
  { iso: 'IR', name: 'Iran', dialCode: '98' },
  { iso: 'IQ', name: 'Iraq', dialCode: '964' },
  { iso: 'IE', name: 'Ireland', dialCode: '353' },
  { iso: 'IT', name: 'Italy', dialCode: '39' },
  { iso: 'JP', name: 'Japan', dialCode: '81' },
  { iso: 'JO', name: 'Jordan', dialCode: '962' },
  { iso: 'KW', name: 'Kuwait', dialCode: '965' },
  { iso: 'LB', name: 'Lebanon', dialCode: '961' },
  { iso: 'LY', name: 'Libya', dialCode: '218' },
  { iso: 'MY', name: 'Malaysia', dialCode: '60' },
  { iso: 'ML', name: 'Mali', dialCode: '223' },
  { iso: 'MR', name: 'Mauritania', dialCode: '222' },
  { iso: 'MA', name: 'Morocco', dialCode: '212' },
  { iso: 'MZ', name: 'Mozambique', dialCode: '258' },
  { iso: 'NL', name: 'Netherlands', dialCode: '31' },
  { iso: 'NZ', name: 'New Zealand', dialCode: '64' },
  { iso: 'NE', name: 'Niger', dialCode: '227' },
  { iso: 'NG', name: 'Nigeria', dialCode: '234' },
  { iso: 'NO', name: 'Norway', dialCode: '47' },
  { iso: 'OM', name: 'Oman', dialCode: '968' },
  { iso: 'PK', name: 'Pakistan', dialCode: '92' },
  { iso: 'PS', name: 'Palestine', dialCode: '970' },
  { iso: 'PH', name: 'Philippines', dialCode: '63' },
  { iso: 'PL', name: 'Poland', dialCode: '48' },
  { iso: 'PT', name: 'Portugal', dialCode: '351' },
  { iso: 'RU', name: 'Russia', dialCode: '7' },
  { iso: 'SN', name: 'Senegal', dialCode: '221' },
  { iso: 'ZA', name: 'South Africa', dialCode: '27' },
  { iso: 'ES', name: 'Spain', dialCode: '34' },
  { iso: 'LK', name: 'Sri Lanka', dialCode: '94' },
  { iso: 'SE', name: 'Sweden', dialCode: '46' },
  { iso: 'CH', name: 'Switzerland', dialCode: '41' },
  { iso: 'SY', name: 'Syria', dialCode: '963' },
  { iso: 'TH', name: 'Thailand', dialCode: '66' },
  { iso: 'TN', name: 'Tunisia', dialCode: '216' },
  { iso: 'TR', name: 'Turkey', dialCode: '90' },
  { iso: 'TM', name: 'Turkmenistan', dialCode: '993' },
  { iso: 'UA', name: 'Ukraine', dialCode: '380' },
  { iso: 'YE', name: 'Yemen', dialCode: '967' },
  { iso: 'ZM', name: 'Zambia', dialCode: '260' },
  { iso: 'ZW', name: 'Zimbabwe', dialCode: '263' },
].map((country) => ({
  ...country,
  flag: isoToFlag(country.iso),
}));

export const DEFAULT_COUNTRY_ISO = 'SO';

export function getCountryByIso(iso) {
  return COUNTRY_CALLING_CODES.find((c) => c.iso === iso) ?? null;
}

export function getDefaultCountry() {
  return getCountryByIso(DEFAULT_COUNTRY_ISO) ?? COUNTRY_CALLING_CODES[0];
}

/** Exact dial code match, longest codes first (e.g. 971 before 97). */
export function findCountryByDialCode(digits) {
  const clean = String(digits || '').replace(/\D/g, '');
  if (!clean) return null;

  const sorted = [...COUNTRY_CALLING_CODES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  );

  return sorted.find((c) => c.dialCode === clean) ?? null;
}

export function searchCountries(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return COUNTRY_CALLING_CODES;

  const digits = q.replace(/\D/g, '');

  return COUNTRY_CALLING_CODES.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (digits && c.dialCode.includes(digits)) return true;
    if (q.startsWith('+') && c.dialCode.includes(q.slice(1).replace(/\D/g, ''))) return true;
    return false;
  });
}

export function parsePhoneValue(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    const fallback = getDefaultCountry();
    return { country: fallback, dialCode: fallback.dialCode, nationalNumber: '' };
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    const fallback = getDefaultCountry();
    return { country: fallback, dialCode: fallback.dialCode, nationalNumber: '' };
  }

  const sorted = [...COUNTRY_CALLING_CODES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  );

  for (const country of sorted) {
    if (digits.startsWith(country.dialCode)) {
      return {
        country,
        dialCode: country.dialCode,
        nationalNumber: digits.slice(country.dialCode.length),
      };
    }
  }

  const fallback = getDefaultCountry();
  return {
    country: fallback,
    dialCode: fallback.dialCode,
    nationalNumber: digits,
  };
}

export function formatPhoneValue(dialCode, nationalNumber) {
  const code = String(dialCode || '').replace(/\D/g, '');
  const national = String(nationalNumber || '').replace(/\D/g, '');
  if (!code && !national) return '';
  if (!national) return '';
  return `+${code}${national}`;
}
