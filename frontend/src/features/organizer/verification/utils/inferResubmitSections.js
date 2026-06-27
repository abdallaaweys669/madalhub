/** Wizard step keys in order (matches verify.jsx steps 1–5). */
export const RESUBMIT_SECTIONS = [
  {
    key: 'organization',
    step: 1,
    icon: 'business-outline',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    title: 'Organization info',
    desc: 'Update your organization details',
  },
  {
    key: 'contact',
    step: 2,
    icon: 'call-outline',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    title: 'Contact details',
    desc: 'Update your contact information',
  },
  {
    key: 'location',
    step: 3,
    icon: 'location-outline',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    title: 'Location',
    desc: 'Update where you operate',
  },
  {
    key: 'proof',
    step: 4,
    icon: 'document-attach-outline',
    iconBg: '#FFEDD5',
    iconColor: '#EA580C',
    title: 'Proof document',
    desc: 'Upload or change your proof',
  },
  {
    key: 'profile',
    step: 5,
    icon: 'image-outline',
    iconBg: '#FCE7F3',
    iconColor: '#DB2777',
    title: 'Organization profile',
    desc: 'Update your logo or brand image',
  },
];

const KEYWORD_MAP = {
  organization: [
    'organization',
    'organisation',
    'org name',
    'company',
    'team name',
    'type',
    'ngo',
    'business name',
  ],
  contact: ['phone', 'contact', 'email', 'website', 'facebook', 'instagram', 'social', 'number'],
  location: ['location', 'city', 'country', 'region', 'address', 'based', 'operate'],
  proof: [
    'proof',
    'document',
    'documnt',
    'license',
    'licence',
    'upload',
    'poster',
    'online link',
    'website link',
    'verify',
    'supporting',
  ],
  profile: ['logo', 'profile', 'image', 'photo', 'brand', 'picture'],
};

/**
 * Infer which verification sections the admin note likely refers to.
 * Returns section keys; falls back to all sections when unclear.
 */
export function inferResubmitSections(rejectionReason) {
  const text = String(rejectionReason || '').toLowerCase();
  if (!text.trim()) {
    return RESUBMIT_SECTIONS.map((s) => s.key);
  }

  const matched = RESUBMIT_SECTIONS.filter(({ key }) =>
    (KEYWORD_MAP[key] || []).some((word) => text.includes(word)),
  ).map((s) => s.key);

  return matched.length > 0 ? matched : RESUBMIT_SECTIONS.map((s) => s.key);
}

export function getSectionByStep(step) {
  return RESUBMIT_SECTIONS.find((s) => s.step === step) ?? null;
}
