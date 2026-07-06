---
name: Afrinza post-login role selection
description: Signup collects only name/email/password; role (buyer/seller/service_provider) is chosen after login via /choose-role.
---

## The rule
Signup (`signUpWithEmail`) no longer sets a default role. After email confirmation and first login, `onAuthStateChange` checks `session.user.user_metadata?.role` — if unset, redirect to `/choose-role`; if set, go to `/dashboard`. `/choose-role` calls `setUserRole(role)` then routes: buyer → `/`, seller → `/become-seller`, service_provider → `/services?register=true`.

**Why:** Simplifies signup friction; user requested role choice happen post-login instead of during registration.

**How to apply:** Any page reachable pre-role-selection that used to auto-create an account inline (old pattern: local authEmail/authPassword state + inline `signUpWithEmail` call inside a form's submit handler, e.g. in `become-seller.tsx` and the service-provider form in `services.tsx`) must instead guard on `useAuthContext().isAuthenticated` and redirect unauthenticated visitors to `/auth`. Do not reintroduce inline signup fields on those pages — auth now always happens first, role selection second.
