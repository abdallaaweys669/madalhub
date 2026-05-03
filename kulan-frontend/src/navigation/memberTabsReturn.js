/** Last member main tabs href so auth welcome "Cancel" can return to the correct tab (home vs explore, etc.). */
let lastMemberTabsHref = '/(tabs)';

export function rememberMemberTabsHref(href) {
  if (typeof href !== 'string' || !href.startsWith('/(tabs)')) return;
  lastMemberTabsHref = href;
}

export function getMemberTabsReturnHref() {
  return lastMemberTabsHref;
}

/** Derive expo-router href from `useSegments()` while user is inside (tabs). */
export function hrefFromTabsSegments(segments) {
  if (!segments || segments[0] !== '(tabs)') return '/(tabs)';
  const parts = segments.slice(1).filter(Boolean);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === 'index')) {
    return '/(tabs)';
  }
  return `/(tabs)/${parts.join('/')}`;
}
