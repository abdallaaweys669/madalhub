# AGENTS.md — Kulan

Read this first. It captures the conventions and gotchas that aren't obvious from
the code alone, so you can make changes that match how this project already works.

## What Kulan is

Kulan is an events app with two user roles:

- **Member** — finds, saves, and joins local events.
- **Organizer** — creates and manages events (with a verification flow before going live).

It has two parts:

| Folder | Stack | Purpose |
| --- | --- | --- |
| `kulan-frontend/` | React Native + Expo (expo-router), JS/TS | Mobile app |
| `kulan-nest-backend/` | NestJS + TypeORM | REST API + auth |

## Environment / shell

- The dev machine is **Windows + PowerShell**. `&&` does **not** chain commands in this
  PowerShell version — run commands on separate lines or use `;`.
- Metro/Expo defaults to port **8081**. If you see `EADDRINUSE: :::8081`, a server is
  already running — reuse that terminal and press `r` to reload instead of starting a new one.

## Running the app

- **Do NOT make `--clear` the default.** `expo start --clear` wipes the whole Metro
  cache, forcing a full cold rebuild (~50s). Use `npm run start` (cached, starts in
  seconds) for everyday work; only run `npm run start:clear` when the cache is actually
  stale (after dep/config changes or weird bundling errors).

```bash
# Frontend (from kulan-frontend/)
npm run start        # expo start (cached — fast)
npm run start:clear  # expo start --clear (only when cache is stale)
npm run android      # native android build
npm run ios          # native ios build

# Backend (from kulan-nest-backend/)
npm run start:dev
```

## Frontend conventions

### Path alias
- `@/` maps to `kulan-frontend/src/` (see `jsconfig.json` + `babel-plugin-module-resolver`).
- Works in both `src/` and the expo-router `app/` directory. Prefer `@/...` imports.

### Navigation — ALWAYS use `useGuardedRouter` (important)
- **Do NOT use expo-router's `useRouter` directly in screens/components.**
- Use `@/hooks/useGuardedRouter` instead. It's a drop-in replacement with the same API
  (`push` / `replace` / `navigate` / `back` / `dismiss`) that **debounces navigation**.
- Why: tapping a navigation button twice quickly used to push the same screen onto the
  stack twice ("screen opens twice" bug). The guard ignores a second nav call within
  ~800ms, fixing this app-wide.
- The ONLY file allowed to call the real `useRouter` is `src/hooks/useGuardedRouter.js`.

```jsx
// Correct
import useGuardedRouter from '@/hooks/useGuardedRouter';
const router = useGuardedRouter();
router.push('/(auth)/signup');
```

### Auth screens (login / signup, member + organizer)
- All auth screens use **`AuthFormScaffold`** (`src/features/auth/components/AuthFormScaffold.jsx`).
- Layout is **full-screen, NO centered card** — fields sit on a **plain white** background
  (`AUTH_FORM_CANVAS` in `welcomeTheme.js`). No animated orbs and **no logo mark** in the header.
- The welcome home screen (`WelcomeScreen`) keeps the warm cream canvas + `WelcomeAnimatedBackground`;
  login/signup do not.
- Top-left **X button** closes back to `/(auth)/welcome`. There is no "Back to Home" button.
- Header is Playfair title + accent word + orange underline only (no `K` icon).
- **Signup fields are stacked one-per-line** (Full Name, Email, Password, Confirm Password).
  Do NOT put name/email side-by-side.
- No social logins (Google/Facebook/Apple) and no phone field on auth screens.

### Shared auth building blocks
- Validation lives in `src/features/auth/validation/authRules.js` (shared by member + organizer).
  Password min length is **8**; reuse `getAuthSignupErrors`, `getPasswordChecks`,
  `getConfirmPasswordDisplayError`, `parseAuthApiFieldErrors`, `getSignupPayload`.
- Signup form state: `useAuthSignupForm` (base) → `useSignupForm` (member) / `useOrganizerSignupForm`.
- Reusable UI: `SignupFormFields`, `PasswordRequirements` (wrapping pill chips with ticks),
  `AuthCheckbox`, `SignupLegalBlock` (18+ / Terms & Privacy), `TextField`, `PasswordField`.
- Inputs are white (`#FFFFFF`) with a subtle orange border so they read clearly on the
  cream background.

### Fonts
- Loaded via `expo-font` using `authFontAssets` from `src/features/auth/theme/authTypography.js`.
- Constants: `FONT_PLAYFAIR_BOLD`, `FONT_PLAYFAIR_SEMIBOLD`, `FONT_JAKARTA_REGULAR`, `FONT_JAKARTA_BOLD`.
- Always gate screens on `fontsLoaded` before rendering text that uses these fonts.

### Splash (`app/splash.jsx`)
- Original animation: orange canvas (`#FF7B3F`), logo fades in, white circle expands to fill the screen.
- Expanding circle is **white** (`#FFFFFF`), not peach (`#FFEFE5`), so the hold frame matches a white app chrome.
- Orange Kulan wordmark SVG on top (default asset colors).

### Warnings
- Known harmless warnings (Reanimated reduced-motion, `setLayoutAnimationEnabledExperimental`)
  are suppressed via `LogBox.ignoreLogs` in `app/_layout.tsx`. Don't re-add the obsolete
  `UIManager.setLayoutAnimationEnabledExperimental` call.

## API logging
- All axios failures are logged **once** in `src/api/logApiError.js` via the client interceptor.
- Expected 4xx (e.g. `Email already exists`) → one line: `[API] POST /member/register → 400: Email already exists`.
- Do **not** `console.log` full `error.response` or axios objects in API modules (avoids Metro spam and leaking request bodies).

## Backend conventions
- DTOs use `class-validator`. Keep password rules aligned with the frontend
  (`@MinLength(8)` in `create-member.dto.ts` and `create-organizer.dto.ts`).
- A `401 UnauthorizedException` on protected routes for unauthenticated requests is
  **expected** behavior, not a crash.

## Working agreements for agents
- Keep changes consistent with the patterns above; prefer reusing the shared auth
  components/hooks over writing new one-off logic.
- After edits, run lint on changed files and fix issues you introduce.
- Don't commit unless explicitly asked.
- **When you discover a new project-wide convention or fix something that future agents
  should know about, document it in this file.**
