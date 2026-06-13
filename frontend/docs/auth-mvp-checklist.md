# Auth MVP Checklist (Kulan)

Use this checklist to move fast now and still launch safely.

## Status legend
- ✅ true = implemented/available now
- ❌ false = not implemented yet

---

## Phase 1 — Build now (Beta-safe minimum)

### Core auth flow
- ✅ true — Signup with email + password works
- ✅ true — Login with email + password works
- ✅ true — Logout clears local token/session
- ✅ true — Persist login session on app restart

### Input + UX safety
- ✅ true — Basic email validation (format)
- ✅ true — Password policy enforced (min length + complexity)
- ✅ true — Clear user-facing error messages
- ❌ false — Generic auth errors for security (avoid leaking account existence)

### Backend safety minimum
- ❌ false — Rate limit login endpoint
- ❌ false — Rate limit signup endpoint
- ❌ false — Hash passwords securely (bcrypt/argon2)
- ❌ false — JWT expiry configured

### Product tracking
- ❌ false — Track signup success rate
- ❌ false — Track login success/fail metrics
- ❌ false — Track auth API error rates

---

## Phase 2 — Required before public launch (Go-live gate)

### Email ownership verification
- ❌ false — Email verification OTP/link flow implemented
- ❌ false — Unverified users blocked from full app access
- ❌ false — Resend verification with cooldown
- ❌ false — Verification expiry + attempt limits

### Account recovery
- ❌ false — Forgot password endpoint
- ❌ false — Reset password flow (token/OTP)
- ❌ false — Password reset invalidates old sessions/tokens

### Abuse prevention
- ❌ false — Rate limit verify/resend/reset endpoints
- ❌ false — Temporary lockout after repeated failed attempts
- ❌ false — Basic bot protection on suspicious traffic

### Compliance + trust basics
- ❌ false — Terms & Privacy accepted at signup
- ❌ false — Audit log for auth-critical events
- ❌ false — Secure environment variable management

---

## Phase 3 — After launch (Advanced)

### Better login options
- ❌ false — Continue with Google
- ❌ false — Continue with Apple (iOS)
- ❌ false — Optional phone OTP login
- ❌ false — Account linking (email + social on same user)

### Session/device controls
- ❌ false — Show active sessions/devices
- ❌ false — Revoke other sessions
- ❌ false — Device-based risk checks

### Security hardening
- ❌ false — Refresh token rotation
- ❌ false — Risk-based step-up checks
- ❌ false — Enhanced anomaly detection

---

## Decision rules for the team

- You can continue building non-auth features while in Phase 1.
- You must complete all Phase 2 items before public launch.
- Phase 3 items are improvements, not launch blockers.

---

## Suggested owner split

- Backend: rate limits, verification, reset, token/session security
- Frontend: auth UI, verification screens, error UX, resend timers
- Product/QA: go-live gate validation and checklist sign-off

---

## Go-live sign-off

- ❌ false — Phase 2 is fully complete
- ❌ false — Postman collection validates all auth scenarios
- ❌ false — Mobile QA passed on Android + iOS
- ❌ false — Team sign-off recorded
