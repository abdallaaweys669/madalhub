# AGENTS.md — MadalHub

Read this first. It captures the conventions and gotchas that aren't obvious from
the code alone, so you can make changes that match how this project already works.

## What MadalHub is

MadalHub is an events app with two user roles:

- **Member** — finds, saves, and joins local events.
- **Organizer** — creates and manages events (with a verification flow before going live).

It has two parts:

| Folder | Stack | Purpose |
| --- | --- | --- |
| `frontend/` | React Native + Expo (expo-router), JS/TS | Mobile app |
| `backend/` | NestJS + TypeORM | REST API + auth |

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
# Frontend (from frontend/)
npm run start        # expo start (cached — fast)
npm run start:clear  # expo start --clear (only when cache is stale)
npm run android      # native android build
npm run ios          # native ios build

# Backend (from backend/)
npm run start:dev
```

## Frontend conventions

### Path alias
- `@/` maps to `frontend/src/` (see `jsconfig.json` + `babel-plugin-module-resolver`).
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
- Reusable UI: `SignupFormFields`, `PasswordRequirements` (strength bar + rule row while typing; hides when all
  rules pass), `AuthCheckbox`, `SignupLegalBlock` (member: 18+ + Terms & Privacy; organizer: Terms only — links open
  `/(modal)/termsOfService` and `/(modal)/privacyPolicy`), `TextField`, `PasswordField`.
- Inputs are white (`#FFFFFF`) with a subtle orange border so they read clearly on the
  cream background.
- For Clerk flows, use `getClerkSessionToken` (`src/features/auth/hooks/getClerkSessionToken.js`)
  after `setActive` / OTP verification instead of a one-shot `getToken()` call (avoids flaky
  "missing session token" errors right after auth completes).

### Fonts
- Loaded via `expo-font` using `authFontAssets` from `src/features/auth/theme/authTypography.js`.
- Constants: `FONT_PLAYFAIR_BOLD`, `FONT_PLAYFAIR_SEMIBOLD`, `FONT_JAKARTA_REGULAR`, `FONT_JAKARTA_BOLD`.
- Always gate screens on `fontsLoaded` before rendering text that uses these fonts.

### Splash (`app/splash.jsx`)
- Original animation: orange canvas (`#FF7B3F`), logo fades in, white circle expands to fill the screen.
- Expanding circle is **white** (`#FFFFFF`), not peach (`#FFEFE5`), so the hold frame matches a white app chrome.
- Orange MadalHub wordmark SVG on top (asset: `kulan_logo.svg`, default colors).
- **Guest routing:** after splash, logged-out users who have **not** seen welcome go to
  `/(auth)/welcome?firstLaunch=1`; otherwise `/(tabs)/explore`. “Browse events as guest” on
  welcome sets `guestWelcomeSeen` in AsyncStorage (`src/navigation/guestWelcome.js`). That flag
  survives logout (not cleared in `clearAll`).

### Guest welcome (`WelcomeScreen`)
- First launch: no Cancel button; **Browse events as guest** → Discovery + marks welcome seen.
- In-app (save/join/settings): Cancel returns to previous tab; guest browse link still available.

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
- **Member email OTP** (signup + passwordless login): Resend via `RESEND_API_KEY` and
  `EMAIL_FROM` in `backend/.env` (see `.env.example`). Without a key, OTP is logged to
  the backend console in dev. Dev sender `onboarding@resend.dev` only delivers to your
  Resend account email until a domain is verified.
- **Foreign keys:** Migration `1749000000000-AddForeignKeyConstraints` adds MySQL FK
  constraints for the 21 active app tables (plus `users.role_id → roles`). ERD tools
  (Workbench reverse engineer) will draw relationship lines after this migration runs.
  Legacy tables (`reviews`, `notifications`, `event_checkins`, etc.) are intentionally
  excluded. Event child rows cascade on delete; nullable refs use `SET NULL`.

## Organizer mandatory verification gate

Organizers **cannot access the dashboard** until their account is `approved`. The gate is enforced at:

- `app/splash.jsx` -- fetches `GET /organizer/status` and routes via `getOrganizerEntryHref()`.
- `app/(organizer)/_layout.jsx` -- redirects away if status is not `approved` (blocks deep links).
- `app/(auth)/organizer-login.jsx` -- uses `organizerStatus` from login response to route.

| Status | Routed to |
| --- | --- |
| `unverified` | `(organizer-status)/welcome` -> 5-step wizard |
| `pending` | `(organizer-status)/pending-verification` (logout only) |
| `rejected` | `(organizer-status)/verification-failed` -> `resubmit-summary` (tap flagged sections or Start Again) -> `verify` |
| `approved` | `(organizer-status)/verification-approved` (once per session) -> `(organizer)/(tabs)` |

**Live status on waiting screens:** `(organizer-status)/_layout.jsx` wraps `OrganizerVerificationStatusProvider`, which polls `GET /organizer/status` every ~12s while pending/rejected/approved status screens are focused. Admin approve/reject auto-navigates to the correct screen; rejected screens refresh the admin note without reload.

**Lookup tables (DB-backed, admin CRUD on dashboard `/verification-types`):**
- `organizer_types` -- seeded types (Company, NGO, Other, etc.). Admin can add, edit, hide (`is_active`), reorder. **Other** cannot be deleted or deactivated. Delete blocked when organizers use the type.
- `organizer_verification_document_types` -- proof options (Business license, Event poster, etc.). Same CRUD rules; **Other** is protected. Delete blocked when uploads reference the slug.
- Mobile wizard reads active types only via `GET /organizer/types` and `GET /organizer/verification-document-types`.
- `organizer_profiles` now has `organizer_type_id`, `phone`, `facebook`, `instagram` columns.

**Wizard steps (in order):** 1) About your organization (name + type), 2) Contact (phone + optional web/social), 3) Location (city + country, e.g. `Mogadishu, Somalia`), 4) Proof (document upload or online links), 5) Profile image (optional logo, JPG/PNG max 5 MB).

**Resubmit (rejected organizers):** `resubmit-summary` shows 5 timeline cards. Admin note keywords flag sections with an **Update** badge (`inferResubmitSections.js`). Tap a section → `verify?step=N&mode=section` (single-step edit, **Save & Resubmit**). **Start Again** runs the full 5-step wizard. Resubmit may send `keepExistingDocument=1` when proof file is unchanged.

**Submit endpoint:** `POST /organizer/verification/submit` -- multipart/form-data (`document` + optional `profileImage`). **Phone and location are required.** Organizer **phone must be unique** across all organizer profiles (normalized digits; stored as E.164 e.g. `+252612345678`). `GET /organizer/verification/check-phone?phone=...` checks availability on step 2. Document optional; if organizer picks no-proof, they must add **website or Facebook or Instagram** on step 4 before submit. Sets `verificationStatus = pending`; saves `users.location`, `users.phone`, and optional `users.profile_img`.

**Admin verification queue** (Next.js dashboard `/verifications`): each row has `proofType` — `document` (view file), `online_presence` (click website/social links), or `none` (cannot approve). Approve when document **or** online links are present; check phone + links manually for no-doc cases.

**Shared UI components:** `src/features/organizer/verification/`
- App-wide step progress: `@/components/common/StepProgressBar` — numbered circle stepper (default, brand orange) with "Step X of Y" label; also supports `variant="segmented"` or `variant="continuous"`
- `components/OrganizerTypeGrid.jsx` -- 2-col selectable type cards; "Other" shows full-width specify field
- `components/DocumentTypeGrid.jsx` -- doc types + no-proof option (requires online links on step 4)
- `components/VerificationLocationStep.jsx` -- location search + GPS detect (step 3)
- `components/VerificationProfileImageStep.jsx` -- circular logo upload (step 5)
- `components/VerificationStatusCard.jsx` -- purple/green/red status card
- `hooks/useOrganizerVerificationWizard.js` -- form state, step nav, submit
- `hooks/useOrganizerVerificationStatusSync.js` + `OrganizerVerificationStatusProvider` -- poll status + redirect on admin decision

**No Maybe Later anywhere** -- verification is mandatory before any dashboard access.

## Organizer publish (approved organizers only)

Once approved, organizers can create and edit **drafts** anytime; **publish** is credit-gated.

| Stage | Can do | Cannot do |
| --- | --- | --- |
| `approved`, has credits | Publish live instantly (uses 1 credit) | Publish when credits = 0 |
| `approved`, no credits | Drafts, request credits from admin | Publish |

**Frontend routing:** `getOrganizerEntryHref()` in `src/navigation/organizerGate.js` returns the correct status screen. Approved organizers see `verification-approved` once per session, then the dashboard.

**Organizer app shell:** Route group `(organizer)/(tabs)/` — bottom tabs **Home · Events · Inbox · Profile**
(tab route file remains `organization.jsx`). Shared chrome lives in `OrganizerTabScaffold`
(`src/features/organizer/components/`): hamburger drawer, header bell (unread badge), FAB (+) for create event, and a **bio reminder banner** when `organizationDescription` is empty or still matches the org name (verification auto-fill). Tapping it opens `edit-profile`.

**Organizer drawer:** Sidebar — Attendees, Credits, expandable **Reports** (Overview, Events,
Registrations, Attendance, Top events); footer: Settings, Sign out. Does not duplicate bottom tabs.
Verification lives under Settings / profile.

**Organizer Events tab:** Filter chips are **Published · Drafts · Past** only (no “All”). Default tab is Published.

**Organizer stack screens** (above tabs in `(organizer)/_layout.jsx`, hide tab bar): `create-event`, `edit-event`,
`pay-to-publish` (publish credits info), `edit-profile`, `attendees`, `followers`, `reviews`, `reports/[type]`,
`analytics` (redirects to overview report), `settings`.

**Organizer account APIs:** `GET /organizer/attendees` (paginated registrations across organizer events),
`GET /organizer/analytics` (event/audience overview), `GET /organizer/reports/:type` (overview | events |
registrations | attendance | top-events — tabular data for in-app reports + CSV export on device),
existing `GET /organizer/followers` and `GET /organizer/reviews/:organizerId` remain available for legacy stack
screens; Profile tab stat tiles are **Events · Attendees · Upcoming** (not followers/rating). Profile links to
`edit-profile` for org name, bio, website, and photo.

**Organizer notifications:** `GET /organizer/notifications` (+ unread-count, mark read). Emitted when
admin approves/rejects verification, grants publish credits, and when a member registers for an organizer event.
Inbox tab: `(organizer)/(tabs)/inbox`. Stale `verification_rejected` rows are hidden (and deleted on approve/resubmit) when status is not `rejected`; inbox tap won't navigate to resubmit unless still rejected.

**Legacy redirects:** `/(organizer)/dashboard`, `profile`, `my-events` redirect into tabs.

**Event type vs category vs run sheet:** **Category** = interest/topic (`interestId`, admin CRUD).
**Event type** = `event_format` (`frontend/src/constants/eventFormats.js`): meetup, talk, seminar,
workshop, panel, bootcamp, conference, summit, hackathon. **Run sheet** (`event_sessions`) is a
**private organizer-only MC agenda** — built from **Manage event → Manage run sheet** (Events tab →
Manage). Not shown on the public event page; API returns sessions only when
`currentUserId === event.organizerId` (admin too). Panel publish still requires 2+ panelists + 1 moderator.

**Create event audience targeting:** Organizer create/edit includes an **Audience** card with
`all`, `female`, or `male` saved as `events.audience_gender`. Restricted events are hidden from
non-matching members in `/events` and recommendations, blocked on direct event open, and blocked
on join. Member gender comes from `member_profiles.gender` (`Female` / `Male` from onboarding).
Capacity `0` means unlimited.

**Publish flow:** Before publish, call `GET /organizer/publish-eligibility` and branch via
`resolveOrganizerPublishGate()` in `src/utils/organizerPublish.js` (verification wizard,
pending screen, or `POST /organizer/credit-requests` + alert when `CREDITS_REQUIRED`). Save draft never checks eligibility.

**Admin credit queue:** Dashboard `/payments` (Credit requests) — admin grants N credits via
`PATCH /admin/credit-requests/:id/grant`. Direct grant: `PATCH /admin/organizers/:id/credits`.

**Admin dashboard (Next.js, port 3001):** Credit requests queue + organizer verification. Mobile `(admin)/` group
is legacy; prefer the Next.js dashboard for admin work.

**Backend publish errors:** Structured `ForbiddenException` body with `code`:
`VERIFICATION_REQUIRED`, `VERIFICATION_PENDING`, `VERIFICATION_REJECTED`, `CREDITS_REQUIRED`.

**Manual QA checklist:**
1. Organizer signup → lands on Home tab → create draft (no publish).
2. Bottom tabs navigate Home / Events / Inbox / Profile; drawer shows secondary items only; FAB creates event.
3. Tap Publish → verification wizard → admin approves identity → admin grants credits → event goes live.
4. No credits → tap Publish → credit request appears in admin queue → admin grants credits → organizer publishes.
5. Member registers for event → organizer Inbox shows registration notification.

## Admin event categories

- Categories live in the `interests` table (`name`, optional `icon` Ionicons slug).
- **Admin dashboard** → **Categories** (`/categories`): create, edit icon, delete (blocked if events use the category).
- Mobile reads icons from API (`GET /events/interests`, `/interests`); falls back to name-based heuristics when `icon` is null.
- After pulling backend changes, run migrations so `interests.icon` exists (`1748700000000-AddInterestIconColumn`).

## Working agreements for agents
- Keep changes consistent with the patterns above; prefer reusing the shared auth
  components/hooks over writing new one-off logic.
- After edits, run lint on changed files and fix issues you introduce.
- Don't commit unless explicitly asked.
- **When you discover a new project-wide convention or fix something that future agents
  should know about, document it in this file.**
