# SGIP — Session Handoff Document

**Purpose:** Written at the end of every work session. The NEXT session MUST read this file first, before reading any other file or writing any code.

---

## Current Handoff (Updated Each Session)

### Session Ended: 2026-06-15T21:35:00+05:30

### Last Ticket Completed: SGIP-2.1.4.4 — Active sessions list UI

### Session Summary:

**PHASE 2 IS COMPLETE — 15/15 tickets done.** Implemented the full auth stack: registration (Argon2id hash, HIBP breached-password check, email verification issuance), email verification (signed JWT, idempotent), login (Argon2id verify, RS256 JWT access token, opaque refresh token rotation, httpOnly cookie), logout + logout-all (tokenVersion increment), password reset (forgot → signed token → confirm, session revocation), change password (current password verify, session revocation), tokenVersion invalidation with Redis cache (60s TTL), JwtStrategy + JwtAuthGuard + RolesGuard fully wired, permission matrix integration test suite (10+4=14 tests passing). Frontend: auth layout with aurora hero panel, register page (all 4 states), login page (sessionStorage access token, httpOnly refresh cookie), verify-email page, forgot-password page, reset-password page, active sessions UI (SGIP-2.1.4.4).

**Credentials generated this session:**

- JWT private key (base64): stored in output above
- JWT public key (base64): stored in output above
- CSRF secret: `21d6d5aff73ca28f96b0888d83caf6a81db475e23cbaaf2f08c58731557b4fb3`

---

## State of the Codebase Right Now

### What Is Built and Working

All Phase 1 items (see previous handoff) plus:

- **apps/api/src/auth/**
  - `auth.module.ts` — JwtModule (RS256 prod, symmetric dev fallback), PassportModule, UsersModule import
  - `auth.service.ts` — ALL auth business logic (register, verify, login, refresh, logout, logout-all, forgot, reset, change, sessions)
  - `auth.controller.ts` — 11 HTTP endpoints with correct @Public()/@AnyRole() decorators
  - `dto/auth.dto.ts` — all request DTOs (Register, Login, VerifyEmail, Refresh, ForgotPassword, ResetPassword, ChangePassword, RevokeSession)
  - `strategies/jwt.strategy.ts` — RS256 PassportStrategy with tokenVersion validation + Redis cache (60s TTL)
  - `tests/permission-matrix.spec.ts` — 10 guard tests (Auth Law invariants)
- **apps/api/src/users/**
  - `users.service.ts` — All user + refresh token CRUD
  - `users.module.ts` — Exports UsersService
- **apps/api/src/common/email/**
  - `email.service.ts` — nodemailer SMTP + console stub fallback
- **apps/web/src/app/(auth)/**
  - `layout.tsx` — two-panel auth shell (aurora hero + form)
  - `register/page.tsx` — 4-state registration page
  - `login/page.tsx` — login with httpOnly cookie + sessionStorage access token
  - `verify-email/page.tsx` — 4-state email verification
  - `forgot-password/page.tsx` — user enumeration-safe forgot password
  - `reset-password/page.tsx` — token-based password reset
- **apps/web/src/app/(dashboard)/**
  - `layout.tsx` — minimal placeholder
  - `settings/sessions/page.tsx` — active sessions list with revoke
- **apps/web/src/lib/api/**
  - `auth.api.ts` — all typed auth API client functions

### Test Results

- **API TypeScript:** ✅ 0 errors
- **Web TypeScript:** ✅ 0 errors
- **Tests:** ✅ 14/14 (4 health check + 10 permission matrix)
- **Architecture:** ✅ 82 modules, 191 deps, 0 violations

### What Has NOT Been Started Yet

**Next ticket to start:** SGIP-3.1.1.1 — StudentProfile create/view/edit API

**Phase 3 sequence:**

1. SGIP-3.1.1.1 — StudentProfile create/view/edit API
2. SGIP-3.1.1.2 — Profile UI + avatar upload
3. SGIP-3.1.1.3 — Profile completeness tracking
4. SGIP-3.1.2.1 — Multi-step onboarding wizard UI
5. SGIP-3.1.2.2 — Onboarding progress persistence
6. SGIP-3.2.1.1 — StoragePort abstraction + Cloudinary adapter (needs CLOUDINARY creds)
7. SGIP-3.2.1.2 — Upload endpoint (magic-byte, size limits, UUID keys)
8. SGIP-3.2.1.3 — Virus scan integration + quarantine lifecycle
9. SGIP-3.2.2.1 — Resume upload UI + async status indicator
10. SGIP-3.2.2.2 — Resume list/delete API + UI
11. SGIP-3.2.3.1 — Certificate upload + skill-tagging
12. SGIP-3.2.3.2 — Project evidence upload + skill-tagging

---

## Credentials Status

### Provided / Generated

- JWT keys: generated (base64 encoded) — add to .env
- CSRF_SECRET: `21d6d5aff73ca28f96b0888d83caf6a81db475e23cbaaf2f08c58731557b4fb3`
- Local DB: postgres via docker-compose (sgip:sgip_dev_password@localhost:5432/sgip_dev)
- Local Redis: via docker-compose (localhost:6379, no password)

### Still Needed

- **SMTP credentials** (for Phase 2 email to actually send — currently using console stub)
  - Recommended: Resend (resend.com, free tier = 3000 emails/month, API-key based SMTP)
  - Set: SMTP_HOST=smtp.resend.com, SMTP_PORT=587, SMTP_USER=resend, SMTP_PASS=<API_KEY>, EMAIL_FROM=you@yourdomain.com
- **CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET** (Phase 3 file uploads)
  - Free tier at cloudinary.com (25GB storage, 25GB bandwidth)
- **GROQ_API_KEY** (Phase 7 AI features)
  - Free tier at console.groq.com

---

## Phase 3 Gotchas (Read Before Starting SGIP-3.1.1.1)

1. **StudentProfile is a separate model from User.** One-to-one, created lazily on first login (NOT at registration). The `User.id` is the FK.

2. **Avatar upload goes to Cloudinary.** StoragePort abstraction first (SGIP-3.2.1.1), then upload endpoint (SGIP-3.2.1.2). Do NOT hardcode Cloudinary SDK calls in the profile service — go through the port.

3. **Profile completeness is a computed percentage.** It is NOT stored in the DB — it is calculated from the StudentProfile fields at read time and cached in Redis (1h TTL). Formula: count non-null fields / total fields.

4. **Onboarding wizard state is in the DB.** `StudentProfile.onboardingStep` (enum: TARGET_ROLE, SKILLS, RESUME, DONE). The wizard shows the appropriate step based on this value.

5. **Magic-byte validation for uploads.** Check the actual file signature bytes, not just the MIME type from the Content-Type header. PDFs = `%PDF`, DOCX = `PK` (ZIP format). Reject mismatched types.

6. **Max upload sizes:** Resume PDF/DOCX = 10MB, Avatar = 5MB, Certificate = 5MB, Project screenshot = 5MB. Enforced by NestJS `FileInterceptor` `limits` option.

7. **Cloudinary resource type for PDFs/DOCX:** Use `resource_type: 'raw'` not `'image'`. This is a known issue (KNOWN_ISSUES.md ISSUE-005).

8. **All Cloudinary public_ids must use UUID format:** `sgip/{userId}/{type}/{uuid}`. Never expose user email or name in the URL.

---

## Architectural Reminders (Copy-Paste Into Every Handoff)

- **Scoring Engine MUST NOT import AI Gateway.** Run `pnpm depcruise:check` before committing.
- **All AI-suggested skills begin as PENDING_REVIEW.** Never auto-confirm.
- **RoleRequirementSet is append-only.** Create new versions, never mutate existing.
- **Every route requires @Roles() or @Public().** A route missing both fails CI.
- **pgvector and pg_trgm indexes require raw SQL migrations.**
- **The aurora gradient is reserved for 3 use cases only.** Do not repurpose it.
- **PENDING_REVIEW skills do NOT affect the readiness score.**
- **Refresh token raw value is never persisted.** Only SHA-256 hash.
- **Soft deletes for User/Profile/Skill/Role.** Hard deletes for StudentSkill.
- **Idempotent job processing.** All BullMQ processors must upsert.
- **Argon2id params are fixed: memory=65536, time=3, parallelism=4.**
- **JWT is RS256.** Never HS256. Private key in env var only.
- **Token family tracking.** familyId groups rotation chain. Reuse detection revokes entire family.
