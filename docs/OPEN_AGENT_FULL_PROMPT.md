# Full prompt for OpenCode / Cursor agent — Organizer profile (single paste)

**Paste everything below this line to your agent.**

---

## CHECKPOINT — READ FIRST (human already did this; do not redo blindly)

The following was completed **before** this prompt runs. **Do not repeat** unless you verify it is missing:

1. **Git**
   - Latest work was **committed and pushed** to GitHub on branch **`main`** (remote: `origin`, repo **Kulan-platform**).
   - Commit message included: *WYSIWYG create-event, organizer dashboard polish, event detail & API*, plus backend migrations for program roster / format / photo URL.

2. **Database migrations (existing codebase — already applied on dev DB)**
   - In **`kulan-nest-backend`**, these migrations **already ran** successfully (`npm run migration:show` showed all `[X]`):
     - `CreateEventProgramRosterTable1746200000000`
     - `AddEventFormatColumnToEvents1746300000000`
     - `AddPhotoUrlToEventProgramRoster1746400000000`
   - **Instruction for you (agent):** Before running `npm run migration:run`, run **`npm run migration:show`** (after `npm run build` if needed). Only apply **new** migrations **you** add for organizer profile / followers / reviews. **Do not** assume an empty database or re-apply old migrations.

3. **API fixes already in tree**
   - `organizerApi.publishEvent` is wired in `src/api/organizer.js` (aliases `publishOrganizerEvent`).

4. **Do not commit junk**
   - Ignore / do not add `kulan-frontend/com.facebook.react.devsupport.BundleDownloader` if present (artifact).

---

## Before you write any code

1. **Read and understand the Kulan project** in this workspace:
   - **Backend:** `kulan-nest-backend` — NestJS modules, TypeORM entities/migrations, existing `organizer` and `onboarding` controllers, JWT + role guards (organizer role **2**), how events and registrations are modeled and counted today.
   - **Frontend:** `kulan-frontend` — Expo Router (`app/(organizer)/profile.jsx`, modals), `src/api/client` and existing organizer/onboarding API calls, auth (`useAuth`, logout), **`COLORS` in `src/theme/colors.ts`** (use these tokens; do not introduce a parallel color system).
2. **Align with existing patterns** (naming, DTOs, error handling, asset URL resolution for avatars) instead of inventing new conventions.
3. **Scope:** Implement only what’s required for the **organizer profile dashboard + followers + reviews aggregates + edit modals + change password + options sheet**, plus the **minimal new backend** to support **real** stats (no hardcoded ratings, follower counts, event counts, or attendee totals in the UI).

---

## Goal

Deliver an **end-to-end, production-oriented** organizer profile experience:

- **Database:** migrations with **clear table names** — e.g. `organizer_follows`, `organizer_reviews` (follows with unique pair; reviews with rating 1–5 and optional comment; aggregates for average rating and counts).
- **Backend:** e.g. **`GET /organizer/profile-dashboard`** returning user + organizer profile fields + **computed** `eventsCount`, `attendeesTotal`, `followersCount`, `ratingAverage` (null if none), `ratingCount`, and **`recentFollowers`** (up to 4 for avatar stack). Reuse existing ownership rules for events/registrations.
- **PATCH** flows for editing profile / organization / about using existing endpoints where possible (`PATCH /onboarding/organizer`, member profile PATCH if applicable); extend DTOs only as needed.
- **Change password:** secure endpoint (current + new password, bcrypt) unless one already exists — **discover by reading the codebase first**.
- **Frontend:** API helpers in `src/api/`; rebuild or heavily upgrade **`app/(organizer)/profile.jsx`** per the premium UI spec (hero, floating stats from API, org card, about, followers section, sign out, bottom sheets, verified modal, edit modals). **Fix or replace `app/(modal)/changePassword.js`** so it is a real change-password screen wired to the API (remove placeholder edit-profile content if present).
- **Options sheet** must include **Change password** → `router.push('/(modal)/changePassword')`.
- **UI data rule:** All displayed numbers for events, attendees, followers, and rating must come from the API — empty/zero/`null` states handled in UI.

---

## Constraints (must follow)

- **Do not modify unrelated files.** Touch only what’s necessary: new migrations/entities/services/controllers/DTOs, targeted frontend API module(s), organizer profile screen, change-password modal, and root layout **only if** strictly required.
- **Keep the app in a working state:** no broken imports, no dead routes, backend compiles, frontend bundles.
- **Theming:** Use **`src/theme/colors.ts`** (`COLORS`) for design tokens; don’t duplicate arbitrary hex values across components.

---

## Order of implementation

1. Backend schema + services + endpoints; verify JSON shape (use `migration:show` before/after **your** new migrations only).
2. Frontend API wrappers.
3. UI + modals + navigation.

---

## When you are finished — required summary for the human

1. **What you changed** — list files created/modified (paths).
2. **New API endpoints** and example response shape for profile dashboard.
3. **Database** — new table names and purpose.
4. **What the human must run manually** — exact commands (e.g. `cd kulan-nest-backend && npm run migration:run` **only if** new migrations were added), env vars.
5. **How to verify** — profile loads, stats real, edits persist, change password works.
6. **Known limitations / TODOs.**

---

## Global rules (append to every task)

- Repository: **Kulan** (`kulan-nest-backend` + `kulan-frontend`).
- Reuse existing Nest patterns (guards, `CurrentUser`, organizer role **2**).
- Reuse `apiClient` and auth token handling.
- No hardcoded demo numbers for stats/ratings/followers in production UI paths.
- Colors: **`src/theme/colors.ts`**.

---

**End of paste.**
