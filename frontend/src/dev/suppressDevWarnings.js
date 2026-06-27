/**
 * Must load before expo-router/entry so Reanimated and other libs
 * cannot emit known dev-only warnings before we patch console.warn.
 */
const IGNORED_DEV_WARNINGS = [
  '[Reanimated] Reduced motion',
  'Reduced motion setting is enabled on this device',
  'setLayoutAnimationEnabledExperimental is currently a no-op',
  'SafeAreaView has been deprecated',
  'Expo Go can no longer provide full access to the media library',
  'Due to changes in Androids permission requirements',
];

function shouldIgnoreDevWarning(args) {
  const message = args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');

  return IGNORED_DEV_WARNINGS.some((prefix) => message.includes(prefix));
}

if (__DEV__ && !global.__MADALHUB_DEV_WARN_PATCHED__) {
  global.__MADALHUB_DEV_WARN_PATCHED__ = true;

  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (shouldIgnoreDevWarning(args)) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

export { IGNORED_DEV_WARNINGS };
