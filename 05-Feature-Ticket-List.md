# Skill Gap Intelligence Platform (SGIP)

## Document 5 — Feature Ticket List

**Version:** 0.1 (Founding Architecture Draft)
**Companion to:** Documents 1–4

---

## How to Read This Backlog

- **Hierarchy**: Epic (`SGIP-P.E`) → Feature (`SGIP-P.E.F`) → Story (`SGIP-P.E.F.S`) → Task (`SGIP-P.E.F.S.T`), where `P` is the phase number. Most Stories in this backlog are sized to be directly actionable; a small set of the highest-complexity Stories (concentrated in Phase 6 and Phase 7, where correctness is most critical) are further decomposed into Tasks as worked examples of the expected decomposition granularity — the same Story→Task breakdown pattern should be applied by the implementing team to any other Story that, on refinement, proves too large for a single PR.
- **Priority**: `P0` = required for MVP launch; `P1` = high value, should ship with or shortly after MVP; `P2` = valuable but deferrable; `P3` = explicitly post-MVP / future-roadmap candidate (Document 1, Section 10).
- **Complexity**: `XS` (<0.5 day), `S` (~1 day), `M` (2–3 days), `L` (~1 week), `XL` (>1 week / needs further decomposition before sprint planning — flagged where this applies).
- **FR/NFR traceability**: where a ticket implements a specific requirement from Document 1, the FR/NFR ID is referenced inline.
- **Dependencies** reference ticket IDs; "None" means the ticket can start as soon as its phase begins (subject to the phase-level dependency stated in the Epic).

---

## Phase 1: Foundation

### SGIP-1.1 — Project & Infrastructure Setup _(Epic · P0 · L)_

**Description:** Establish the monorepo, database (with required PostgreSQL extensions), queue, and per-environment configuration that all subsequent development depends on.
**Dependencies:** None
**Acceptance Criteria:**

- Monorepo builds, lints, and runs locally for both `apps/web` and `apps/api`.
- CI pipeline passes on a trivial PR (lint, typecheck, test, build all green).
- PostgreSQL with `pgvector`, `pg_trgm`, and `pgcrypto` extensions is provisioned and reachable in dev and staging.
- Redis is provisioned and reachable in dev and staging.
- Environment configuration (dev/staging/production) is documented and secrets are not committed to the repo.

#### SGIP-1.1.1 — Monorepo & Tooling Setup _(Feature · P0 · M)_

**Description:** Initialize the monorepo structure and shared developer tooling (linting, formatting, commit hooks, CI).
**Dependencies:** None
**Acceptance Criteria:**

- `apps/web`, `apps/api`, and `packages/shared` (shared types/DTOs) exist with working build scripts.
- Shared ESLint/Prettier config applied consistently across packages.
- Pre-commit hooks run lint + format on staged files.

**SGIP-1.1.1.1 — Initialize monorepo structure (apps/web, apps/api, packages/shared)** _(Story · P0 · S)_
Description: Set up a workspace-based monorepo (e.g., npm/pnpm workspaces) with placeholder Next.js and NestJS apps and a shared types package.
Dependencies: None
AC:

- Running install at repo root installs all workspace dependencies.
- `apps/web` runs `next dev`; `apps/api` runs `nest start` with a placeholder health endpoint.
- `packages/shared` is importable from both apps via workspace reference.

**SGIP-1.1.1.2 — Configure linting, formatting, and pre-commit hooks** _(Story · P0 · S)_
Description: Add ESLint, Prettier, and a Git hook runner (e.g., Husky + lint-staged) configured for TypeScript across both apps.
Dependencies: SGIP-1.1.1.1
AC:

- `lint` script fails on intentionally-introduced lint errors.
- Pre-commit hook blocks a commit containing a lint error.
- Formatting rules are enforced consistently (no per-app divergence).

**SGIP-1.1.1.3 — Configure CI pipeline (lint, typecheck, test, build)** _(Story · P0 · S)_
Description: GitHub Actions workflow that runs lint, typecheck, unit tests, and build for both apps on every PR.
Dependencies: SGIP-1.1.1.2
AC:

- PR checks block merge on any failing step.
- Build artifacts (or build success) are produced for both `apps/web` and `apps/api`.
- Pipeline run time is reported so future regressions in CI speed are visible.

#### SGIP-1.1.2 — Database & ORM Setup _(Feature · P0 · M)_

**Description:** Provision PostgreSQL with the extensions required by Document 2 (§6.3, §12), initialize Prisma, and create the initial seed pipeline for the taxonomy.
**Dependencies:** SGIP-1.1.1
**Acceptance Criteria:**

- `pgvector`, `pg_trgm`, `pgcrypto` extensions enabled via a dedicated, well-commented migration.
- Prisma schema reflects the core entity skeleton from Document 2 §4.1 (tables may be empty of business logic but exist with correct relations).
- Seed script populates an initial taxonomy sufficient for development/testing.

**SGIP-1.1.2.1 — Provision PostgreSQL with pgvector + pg_trgm + pgcrypto extensions** _(Story · P0 · S)_
Description: Create a dedicated Prisma migration that enables required extensions via raw SQL, per Document 2 §12's note on Prisma's lack of native vector-column support.
Dependencies: SGIP-1.1.1.1
AC:

- Migration runs cleanly on a fresh database in dev, staging, and CI test databases.
- Migration is clearly commented explaining why raw SQL is used (future-maintainer context).
- `SELECT * FROM pg_extension` confirms all three extensions post-migration.

**SGIP-1.1.2.2 — Initialize Prisma schema + base migration (core entity skeleton)** _(Story · P0 · M)_
Description: Define Prisma models for `User`, `Organization`, `RefreshToken`, `StudentProfile`, `Skill`, `SkillAlias`, `Role`, `RoleAlias`, `RoleRequirementSet`, `RoleRequirement`, `StudentSkill`, `StudentTargetRole` per Document 2 §4.1–4.2 (relations and field types only; business logic comes in later phases).
Dependencies: SGIP-1.1.2.1
AC:

- `prisma migrate dev` succeeds and generates a client without errors.
- ER diagram generated from the schema matches Document 2 §4.2 at the entity/relation level.
- `Organization` FK on `User`/`StudentProfile` is nullable, per Document 1 §3.3 design decision.

**SGIP-1.1.2.3 — Seed data scripts for skills/roles taxonomy (initial seed set)** _(Story · P0 · M)_
Description: Author a seed script populating an initial set of canonical skills (categorized) and canonical roles with a first `RoleRequirementSet` version each, sufficient for end-to-end testing of later phases.
Dependencies: SGIP-1.1.2.2
AC:

- Seed script is idempotent (safe to re-run without duplicating rows).
- At least one role (e.g., "Full Stack Developer") has a complete `RoleRequirementSet` with `REQUIRED`/`IMPORTANT`/`NICE_TO_HAVE` requirements, usable for scoring-engine tests in Phase 6.
- Seed data documented (source/rationale) for future taxonomy expansion.

#### SGIP-1.1.3 — Core Infrastructure Services _(Feature · P0 · M)_

**Description:** Configure Redis for queueing and caching, stand up the BullMQ worker entrypoint, and establish environment/secrets management conventions.
**Dependencies:** SGIP-1.1.1
**Acceptance Criteria:**

- Redis connection is health-checked from both API and worker processes.
- A "hello world" BullMQ job can be enqueued by the API and processed by the worker.
- Secrets are sourced from environment-appropriate stores, never from committed files.

**SGIP-1.1.3.1 — Configure Redis (queue + cache) connection and health checks** _(Story · P0 · S)_
Description: Add Redis client configuration shared by API and worker, with a `/health` endpoint check.
Dependencies: SGIP-1.1.1.1
AC:

- `/health` reports Redis connectivity status.
- Connection configuration is environment-driven (dev/staging/prod).

**SGIP-1.1.3.2 — Set up BullMQ queue infrastructure + worker process entrypoint** _(Story · P0 · M)_
Description: Create the separate worker `main.ts` (Document 2 §1, "same codebase, different entrypoint") and register placeholder queues for `documents`, `normalization`, `roadmap`, `scoring` (per Document 2 §7.2 table).
Dependencies: SGIP-1.1.3.1
AC:

- Worker process starts independently from the API process and connects to the same NestJS module providers.
- A test job enqueued from the API is observably processed by the worker (logged).
- Queue names match Document 2 §7.2 exactly, to avoid drift when real processors are added in later phases.

**SGIP-1.1.3.3 — Configure environment/secrets management per environment** _(Story · P0 · S)_
Description: Define `.env.example` files documenting all required variables and configure provider-native secret storage for staging/production (Document 2 §11).
Dependencies: SGIP-1.1.1.1
AC:

- `.env.example` lists every required variable with a description, with no real secret values.
- Staging/production secrets are stored in a managed secrets service, not `.env` files in the deployed image.
- Application fails fast with a clear error if a required secret is missing (no silent defaults for security-relevant config).

---

### SGIP-1.2 — Architecture Scaffolding _(Epic · P0 · L)_

**Description:** Establish the NestJS module skeletons, cross-cutting conventions (validation, error handling, architecture-boundary enforcement), and the themed Next.js frontend shell, so all feature work in later phases follows consistent, pre-agreed patterns.
**Dependencies:** SGIP-1.1
**Acceptance Criteria:**

- All Document 2 §6.1 modules exist as empty-but-wired NestJS modules.
- A global validation pipe and exception filter produce consistent request/response shapes.
- An architecture-boundary check (e.g., dependency-cruiser) runs in CI and fails on a deliberately-introduced violation of Document 2 §3's module-dependency rules.
- The Next.js app renders a themed shell (Document 4 tokens) in both dark and light mode.

#### SGIP-1.2.1 — NestJS Module Scaffolding _(Feature · P0 · M)_

**Description:** Create module skeletons for every module listed in Document 2 §6.1, plus global cross-cutting infrastructure.
**Dependencies:** SGIP-1.1.2.2
**Acceptance Criteria:**

- `auth`, `users`, `profiles`, `skills`, `roles`, `normalization`, `scoring`, `documents`, `ai-gateway`, `admin`, `audit`, `notifications`, `common` modules exist with at least a module file and a placeholder controller/service.
- Global validation, exception filter, and response conventions are applied app-wide.
- Architecture-boundary lint rules are configured and enforced in CI.

**SGIP-1.2.1.1 — Create module skeletons for all Document 2 §6.1 modules** _(Story · P0 · M)_
Description: Scaffold each module with the standard internal layering (controller/service/repository/dto/entities/ports) described in Document 2 §3.
Dependencies: SGIP-1.1.2.2
AC:

- Each module compiles and is registered in the root `AppModule` (API) and `WorkerModule` (worker), as appropriate.
- Folder structure matches Document 2 §3 layering for at least one reference module (used as the template others follow).

**SGIP-1.2.1.2 — Implement global ValidationPipe, exception filters, and response/error shape conventions** _(Story · P0 · M)_
Description: Configure a global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` (Document 3 §8.3) and a global exception filter producing a consistent error envelope (e.g., `{ error: { code, message, fieldErrors? } }`) consumed by Document 4's error-state components.
Dependencies: SGIP-1.2.1.1
AC:

- A request with an unexpected extra field is rejected with 400, not silently accepted.
- All thrown `HttpException`s produce the standard error envelope, including field-level validation errors.
- Unhandled exceptions are caught, logged with correlation ID, and return a generic 500 envelope (no stack traces leaked to clients).

**SGIP-1.2.1.3 — Implement architecture-boundary lint rules (dependency-cruiser) enforcing Document 2 §3 module dependency rules** _(Story · P0 · S)_
Description: Configure dependency-cruiser (or equivalent) rules encoding the Document 2 §3 constraint (e.g., Scoring and Taxonomy modules must not import AI Gateway).
Dependencies: SGIP-1.2.1.1
AC:

- A deliberately-introduced forbidden import (e.g., `scoring` importing `ai-gateway`) fails CI.
- Allowed dependency directions (e.g., `ai-gateway -> scoring`, `normalization -> taxonomy`) pass.
- Rules are documented inline so future contributors understand _why_ a given import is forbidden.

#### SGIP-1.2.2 — Next.js Frontend Scaffolding _(Feature · P0 · M)_

**Description:** Initialize the Next.js App Router project, apply Document 4's design tokens as the Tailwind/ShadCN theme, and wire up TanStack Query with a generated typed API client.
**Dependencies:** SGIP-1.1.1.1
**Acceptance Criteria:**

- App Router project builds with Tailwind + ShadCN configured.
- Dark theme (default) and light theme (Document 4 §3.6) both render using the Document 4 color/typography tokens.
- TanStack Query provider wraps the app; a typed client generated from the API's OpenAPI spec is consumable from a page.

**SGIP-1.2.2.1 — Initialize Next.js App Router project with Tailwind + ShadCN base install** _(Story · P0 · S)_
Description: Scaffold the Next.js app with Tailwind CSS and install ShadCN UI's CLI/component baseline.
Dependencies: SGIP-1.1.1.1
AC:

- App builds and serves a placeholder page.
- ShadCN components can be added via its CLI and render correctly.

**SGIP-1.2.2.2 — Implement Document 4 design tokens (color, typography, spacing) as Tailwind theme + CSS variables, dark and light** _(Story · P0 · M)_
Description: Translate Document 4 §3–5 token tables into Tailwind `theme.extend` config and CSS variables, including the Geist/Inter/Geist Mono font setup (Document 4 §4.1) and the dark/light token sets (Document 4 §3.2–3.6).
Dependencies: SGIP-1.2.2.1
AC:

- Switching a `data-theme` attribute (or equivalent) toggles between dark and light token sets without a page reload.
- A sample page demonstrates `display-md`, `body-md`, and `data-md` typography tokens rendering with the correct fonts.
- Semantic status colors (Document 4 §3.5) are defined as reusable tokens, not hardcoded per-component.

**SGIP-1.2.2.3 — Set up TanStack Query provider + typed API client generation pipeline from OpenAPI spec** _(Story · P0 · M)_
Description: Add a TanStack Query provider at the app root and a build step that generates a typed client from the NestJS OpenAPI spec (Document 2 §8.3).
Dependencies: SGIP-1.2.2.1, SGIP-1.2.1.2
AC:

- A placeholder API endpoint's types are available in the frontend via the generated client.
- A sample page successfully fetches and displays data via a TanStack Query hook using the generated client.
- Regenerating the client after an API DTO change updates frontend types without manual edits.

---

### SGIP-1.3 — Observability & DevOps Baseline _(Epic · P1 · M)_

**Description:** Establish structured logging, tracing, containerization, and the deployment pipeline before feature work begins, so every feature shipped from Phase 2 onward is observable and deployable.
**Dependencies:** SGIP-1.1
**Acceptance Criteria:**

- API and worker emit structured JSON logs with request correlation IDs.
- A basic trace/metric is visible in the configured APM for a sample request.
- API and worker are containerized and deployable to staging via CI/CD.

#### SGIP-1.3.1 — Logging & Monitoring _(Feature · P1 · S)_

**Description:** Structured logging and baseline OpenTelemetry instrumentation.
**Dependencies:** SGIP-1.1.1.1
**Acceptance Criteria:**

- Every log line includes a request/job correlation ID.
- Traces for a sample API request and a sample worker job are visible in the APM.

**SGIP-1.3.1.1 — Structured JSON logging with request correlation IDs** _(Story · P1 · S)_
Description: Add a logging interceptor/middleware generating or propagating a correlation ID per request/job, included in all log entries.
Dependencies: SGIP-1.2.1.1
AC:

- Logs are structured JSON (not plain text) in staging/production.
- The same correlation ID appears in logs for an API request and any jobs it enqueues.

**SGIP-1.3.1.2 — OpenTelemetry instrumentation baseline (traces + metrics export)** _(Story · P1 · M)_
Description: Instrument the API and worker with OpenTelemetry, exporting to the chosen APM (Document 2 §11), including custom attributes for AI-call spans (`provider`, `feature`, `tokens`, `costEstimate` — Document 2 §11) as placeholders for Phase 7.
Dependencies: SGIP-1.3.1.1
AC:

- A sample request trace shows API → DB span breakdown.
- AI-call span attribute names are reserved/defined now so Phase 7's AI Gateway only needs to populate them, not redesign telemetry.

#### SGIP-1.3.2 — Deployment Pipeline _(Feature · P1 · M)_

**Description:** Containerize the API and worker, define infrastructure-as-code for managed Postgres/Redis/compute, and configure CI/CD for staging and production.
**Dependencies:** SGIP-1.1.3, SGIP-1.2.1
**Acceptance Criteria:**

- API and worker images build successfully in CI.
- Staging environment is deployable via a CI/CD pipeline run.
- Infrastructure (DB, Redis, compute) is defined as code, not manually provisioned.

**SGIP-1.3.2.1 — Containerize API and worker processes (Dockerfiles, multi-stage builds)** _(Story · P1 · M)_
Description: Write multi-stage Dockerfiles for the API and worker entrypoints, optimized for image size and build cache reuse.
Dependencies: SGIP-1.1.3.2
AC:

- Both images build successfully and start without errors against a local Postgres/Redis.
- Image sizes are reasonable (no dev dependencies bundled into the final stage).

**SGIP-1.3.2.2 — IaC baseline for managed Postgres (pgvector-capable), Redis, and container platform** _(Story · P1 · M)_
Description: Define Terraform (or equivalent) for the managed Postgres instance (verified pgvector support per Document 2 §11), managed Redis, and the chosen container platform's compute resources.
Dependencies: SGIP-1.3.2.1
AC:

- `terraform plan`/`apply` provisions a working staging environment from scratch.
- Provisioned Postgres instance supports `pgvector` (verified, not assumed).
- Configuration is parameterized for staging vs. production.

**SGIP-1.3.2.3 — Configure staging and production environments with CI/CD deploy gates** _(Story · P1 · M)_
Description: Extend the CI pipeline (SGIP-1.1.1.3) to deploy to staging automatically on merge to main, and to production via a manual approval gate.
Dependencies: SGIP-1.3.2.2
AC:

- Merge to main triggers a staging deploy that succeeds.
- Production deploy requires explicit approval and runs database migrations as a controlled step (Document 2 §10.1).
- A failed deploy does not leave the environment in a partially-migrated state without alerting.

---

## Phase 2: Authentication

### SGIP-2.1 — Identity & Access _(Epic · P0 · XL)_

**Description:** Implement registration, email verification, login, JWT/refresh-token session management, password security, and the RBAC foundation, per Document 3 in full.
**Dependencies:** SGIP-1.2
**Acceptance Criteria:**

- A user can register, verify their email, log in, refresh their session, and log out end-to-end.
- Document 3's permission matrix (§2.3) is enforced and covered by integration tests.
- Refresh-token rotation and reuse-detection (Document 3 §4.1) behave as specified.

#### SGIP-2.1.1 — Registration & Email Verification _(Feature · P0 · M)_

**Description:** User registration with email/password and a verification-token flow (FR-AUTH-01, FR-AUTH-02).
**Dependencies:** SGIP-1.2.1.2, SGIP-1.1.3 (for email queueing)
**Acceptance Criteria:**

- Registration creates a `User` with `emailVerifiedAt = null` and sends a verification email.
- Verification link marks the account verified exactly once; reuse of a consumed/expired token fails gracefully.
- Registration/login error messages do not reveal whether an email is already registered (Document 3 §1.1, T1).

**SGIP-2.1.1.1 — User registration endpoint (validation, duplicate-email handling, generic responses)** _(Story · P0 · M)_
Description: `POST /auth/register` validates email/password (Document 3 §6 complexity rules), normalizes email to lowercase, hashes the password with Argon2id, and creates a `User`. Returns a generic success response regardless of whether the email was already registered (to avoid enumeration), while internally skipping creation/sending a "you already have an account" email instead for existing emails.
Dependencies: SGIP-1.1.2.2, SGIP-1.2.1.2
AC:

- Valid registration creates a `User` row with `passwordHash` (never plaintext) and `emailVerifiedAt = null`.
- Registering with an already-used email returns the same response shape as a fresh registration (T1 mitigation) and does not create a duplicate row.
- Password complexity violations return field-level 400 errors.

**SGIP-2.1.1.2 — Email verification token issuance & consumption** _(Story · P0 · M)_
Description: Generate a single-use, time-limited (24h), hashed verification token on registration; `GET/POST /auth/verify-email` consumes it and sets `emailVerifiedAt`.
Dependencies: SGIP-2.1.1.1, SGIP-1.1.3.2 (email send via queue)
AC:

- Verification token is stored hashed, not in plaintext (Document 3 §1.1).
- Expired or already-used tokens return a clear "expired/invalid" error without revealing account existence details.
- "Resend verification email" is rate-limited per account.

**SGIP-2.1.1.3 — Registration & verification UI (form, validation states, resend flow)** _(Story · P0 · M)_
Description: Build the registration form and post-registration "check your email" / verification-pending screen, with resend action.
Dependencies: SGIP-2.1.1.1, SGIP-2.1.1.2, SGIP-1.2.2.2
AC:

- Form shows field-level validation errors per Document 4 §14.
- Verification-pending screen offers a resend action with appropriate cooldown/disabled state.
- Successful verification redirects into the onboarding flow (Phase 3).

#### SGIP-2.1.2 — Login & Session _(Feature · P0 · L)_

**Description:** Login with Argon2id verification, JWT access-token issuance, refresh-token rotation with reuse detection, and logout (FR-AUTH-03, FR-AUTH-04).
**Dependencies:** SGIP-2.1.1
**Acceptance Criteria:**

- Successful login issues an access token (15-min JWT, RS256) and a refresh token (httpOnly cookie, rotating).
- Presenting a revoked refresh token revokes its entire token family and logs a `HIGH`-severity audit event (Document 3 §4.1).
- Logout revokes the current token family and clears auth cookies.

**SGIP-2.1.2.1 — Login endpoint with Argon2id verification + generic error messages** _(Story · P0 · M)_
Description: `POST /auth/login` verifies email/password against `passwordHash`; returns a generic "invalid credentials" error for both unknown-email and wrong-password cases (Document 3 §1.1, T1). Enforces rate limiting (Document 3 §6: 5 attempts/15min per IP+email).
Dependencies: SGIP-2.1.1.1
AC:

- Wrong password and unknown email return identical error responses and status codes.
- Rate limit triggers after the configured threshold and returns a clear (but non-enumerating) rate-limit error.
- Successful login proceeds to token issuance (SGIP-2.1.2.2/.3).

**SGIP-2.1.2.2 — JWT access token issuance (RS256, claims, tokenVersion)** _(Story · P0 · M)_
Description: Issue a 15-minute RS256-signed JWT containing `sub`, `role`, `studentProfileId` (if applicable), `tokenVersion`, `iat`, `exp` per Document 3 §3. Public key made available for verification by any future service.
Dependencies: SGIP-2.1.2.1
AC:

- Token verification succeeds with the public key and fails with a tampered signature.
- `tokenVersion` claim matches the current value on `User` at issuance time.
- No PII (email, name) is present in token claims.

**SGIP-2.1.2.3 — Refresh token issuance, rotation, and reuse detection** _(Story · P0 · L)_
Description: Issue an opaque, CSPRNG-generated refresh token (hashed before storage) on login; on each `/auth/refresh` call, rotate (issue new, revoke old, link via `familyId`); if a revoked token is presented, revoke the entire family and write a `HIGH` audit entry (Document 3 §4.1).
Dependencies: SGIP-2.1.2.2, SGIP-1.1.2.2
AC:

- Refresh token raw value is never persisted — only its hash.
- A successful refresh revokes the prior token and the new token shares the same `familyId`.
- Presenting a revoked token revokes all tokens in that `familyId` and creates an `AuditLog` entry with severity `HIGH`.

**SGIP-2.1.2.4 — Login UI + httpOnly cookie handling + CSRF double-submit token** _(Story · P0 · M)_
Description: Build the login form; configure refresh token as `httpOnly`/`Secure`/`SameSite=Strict` cookie scoped to `/api/auth/refresh` (Document 3 §4.2), and implement the double-submit CSRF token (Document 3 §4.3) for state-changing requests.
Dependencies: SGIP-2.1.2.1, SGIP-2.1.2.3, SGIP-1.2.2.2
AC:

- Refresh token cookie is not readable via `document.cookie` (httpOnly verified).
- A state-changing request without the CSRF header is rejected.
- Login form shows the generic error message from SGIP-2.1.2.1 without distinguishing failure reasons.

**SGIP-2.1.2.5 — Logout (revoke session family) and "log out of all devices"** _(Story · P1 · S)_
Description: `POST /auth/logout` revokes the current refresh-token family and clears cookies; `POST /auth/logout-all` revokes all `RefreshToken` rows for the user and bumps `tokenVersion` (Document 3 §4.4).
Dependencies: SGIP-2.1.2.3, SGIP-2.1.4.2
AC:

- After logout, the previously-issued refresh token can no longer be used to obtain a new access token.
- "Log out of all devices" invalidates outstanding access tokens immediately via `tokenVersion`, not just on their natural expiry.

#### SGIP-2.1.3 — Password Management _(Feature · P0 · M)_

**Description:** Password reset flow and breached-password checking (Document 3 §6, FR-AUTH-05).
**Dependencies:** SGIP-2.1.2
**Acceptance Criteria:**

- A user can request a reset, receive a single-use time-limited link, and set a new password.
- Successful reset revokes existing sessions for that user.
- Registration and reset reject passwords found in a breached-password corpus.

**SGIP-2.1.3.1 — Password reset request + emailed token flow** _(Story · P0 · M)_
Description: `POST /auth/password-reset/request` issues a single-use, 1-hour, hashed token and emails a reset link; returns a generic response regardless of whether the email exists (T1).
Dependencies: SGIP-2.1.1.2 (reuses email-token infra patterns)
AC:

- Requesting a reset for a non-existent email returns the same response as for an existing one.
- Token is stored hashed and expires after 1 hour.
- Requesting multiple resets invalidates earlier outstanding reset tokens for that user.

**SGIP-2.1.3.2 — Password reset confirmation endpoint + UI, with session revocation** _(Story · P0 · M)_
Description: `POST /auth/password-reset/confirm` validates the token, updates `passwordHash`, bumps `tokenVersion`, and revokes all refresh tokens for the user (Document 3 §6).
Dependencies: SGIP-2.1.3.1, SGIP-2.1.4.2
AC:

- Successful reset invalidates all prior sessions (verified via a previously-issued access token failing `tokenVersion` check post-reset).
- Reset UI shows password complexity requirements and field-level errors.

**SGIP-2.1.3.3 — Breached-password check integration at registration/reset** _(Story · P1 · S)_
Description: Integrate a k-anonymity breached-password check (Document 3 §6) into registration and password-change/reset flows.
Dependencies: SGIP-2.1.1.1, SGIP-2.1.3.2
AC:

- A password from a known breach corpus is rejected with an actionable message.
- The check fails open (does not block registration/reset) if the breach-check service is unreachable, logging the degraded state rather than blocking users.

#### SGIP-2.1.4 — Authorization Foundation _(Feature · P0 · M)_

**Description:** Implement the guards, decorators, `tokenVersion` invalidation, and the permission-matrix test suite that all later phases' endpoints rely on (Document 3 §2).
**Dependencies:** SGIP-2.1.2.2
**Acceptance Criteria:**

- Every controller route has either `@Public()` or `@Roles(...)`; a route with neither fails CI.
- `tokenVersion` mismatches cause access-token rejection even before natural expiry.
- The Document 3 §2.3 permission matrix has a corresponding automated test for every cell.

**SGIP-2.1.4.1 — JwtAuthGuard + RolesGuard + @Public()/@Roles() decorators, default-deny enforcement** _(Story · P0 · M)_
Description: Implement guards verifying JWT signature, expiry, and `tokenVersion`; `RolesGuard` checks `@Roles(...)` against `user.role`; a lint/CI check fails if any route lacks both `@Public()` and `@Roles(...)`.
Dependencies: SGIP-2.1.2.2, SGIP-1.2.1.3
AC:

- A route without a role/public decorator fails CI (Document 3 §2.1 #1).
- A `STUDENT` calling an `@Roles('ADMIN')` route receives 403.
- An expired or `tokenVersion`-mismatched JWT is rejected with 401.

**SGIP-2.1.4.2 — tokenVersion invalidation mechanism (password change, role change, forced logout)** _(Story · P0 · S)_
Description: Centralize the `tokenVersion` increment as a reusable service method, invoked by password-reset (SGIP-2.1.3.2), "log out all devices" (SGIP-2.1.2.5), and (in Phase 8) admin role changes.
Dependencies: SGIP-2.1.4.1
AC:

- Incrementing `tokenVersion` immediately invalidates all previously-issued access tokens for that user, verified by an integration test.
- The increment is atomic with the triggering action (e.g., password update and `tokenVersion` bump occur in the same transaction).

**SGIP-2.1.4.3 — Permission matrix integration test suite (Document 3 §2.3 as source of truth)** _(Story · P0 · M)_
Description: Build a parameterized integration-test suite asserting, for a representative endpoint per resource/action in Document 3 §2.3, that each role/ownership combination returns the expected ✅/🔶/❌ result.
Dependencies: SGIP-2.1.4.1
AC:

- Every ❌ cell in the matrix has a passing "returns 403" test.
- Every 🔶 cell has both an "owner succeeds" and "non-owner 403" test.
- Test suite is runnable in CI and re-run automatically as new endpoints are added in later phases (template provided for new endpoints to extend the suite).

**SGIP-2.1.4.4 — Active sessions list UI + revoke-session action** _(Story · P2 · M)_
Description: List `RefreshToken` families for the current user (device/IP/last-used metadata) with a per-session revoke action (Document 3 §5).
Dependencies: SGIP-2.1.2.3, SGIP-1.2.2.3
AC:

- User sees a list of active sessions with last-used timestamps.
- Revoking a session immediately invalidates that session's refresh token; the session disappears from the list on next load.
- The current session is clearly distinguished from others.

---

## Phase 3: Student Management

### SGIP-3.1 — Profile & Account _(Epic · P0 · L)_

**Description:** Student profile CRUD, profile-completeness tracking, and the onboarding wizard (FR-PROFILE-01, FR-PROFILE-02).
**Dependencies:** SGIP-2.1
**Acceptance Criteria:**

- A newly-verified student can complete a profile and progress through onboarding.
- Profile completeness is computed and exposed to the frontend for onboarding nudges.

#### SGIP-3.1.1 — Student Profile CRUD _(Feature · P0 · M)_

**Description:** Create/view/edit `StudentProfile`, including avatar upload, and profile-completeness computation.
**Dependencies:** SGIP-2.1.4.1, SGIP-1.1.2.2
**Acceptance Criteria:**

- A `STUDENT` can create and edit their own profile; cannot view/edit another student's profile (permission matrix §2.3).
- Profile completeness score updates as fields are filled in.

**SGIP-3.1.1.1 — StudentProfile create/view/edit API (FR-PROFILE-01)** _(Story · P0 · M)_
Description: `POST/GET/PATCH /students/me/profile` for `StudentProfile` fields (name, education details, program/branch, graduation year, location, bio, avatarUrl).
Dependencies: SGIP-2.1.4.3
AC:

- `GET /students/me/profile` returns only the requesting student's own profile (ownership-checked).
- `PATCH` rejects unknown fields (Document 3 §8.3 mass-assignment protection) — e.g., `organizationId`, `userId` are not editable via this endpoint.
- A second student's `GET /students/{otherId}/profile` (if such a route exists) returns 403/404 per the permission matrix.

**SGIP-3.1.1.2 — Profile UI (form, avatar upload via StoragePort)** _(Story · P0 · M)_
Description: Build the profile edit form and avatar upload, using the `StoragePort`/Cloudinary integration (built in SGIP-3.2.1) for avatar storage.
Dependencies: SGIP-3.1.1.1, SGIP-3.2.1.1
AC:

- Avatar upload respects size/MIME validation (Document 3 §7).
- Form shows validation errors per Document 4 §14.
- Profile changes are reflected immediately via TanStack Query cache update.

**SGIP-3.1.1.3 — Profile completeness tracking (FR-PROFILE-02) + onboarding nudge logic** _(Story · P1 · S)_
Description: Compute a completeness percentage based on filled profile fields + presence of at least one skill/target role/resume, exposed via the profile API for use in onboarding nudges (Document 4 dashboard empty states).
Dependencies: SGIP-3.1.1.1
AC:

- Completeness percentage updates as relevant fields/related entities change.
- API exposes which specific items are missing, for the UI to render targeted prompts.

#### SGIP-3.1.2 — Onboarding Flow _(Feature · P0 · M)_

**Description:** Multi-step onboarding wizard (profile → skills → resume → target role) with progress persistence (Document 1 §4.1).
**Dependencies:** SGIP-3.1.1, SGIP-4.2 (skills), SGIP-5.2 (target role) — _note: onboarding wizard steps for skills/target-role are functionally completed once Phases 4–5 land; this feature's own tickets cover the wizard shell and step navigation, which can be built against stubs initially._
**Acceptance Criteria:**

- A new user is guided through profile → skills → resume → target role on first login.
- Leaving and returning to onboarding resumes at the correct step.

**SGIP-3.1.2.1 — Multi-step onboarding wizard UI (profile → skills → resume → target role)** _(Story · P0 · L)_
Description: Build the wizard shell with step indicator, navigation, and per-step forms wired to the relevant APIs (profile now; skills/resume/target-role steps wired once their APIs land in Phases 4–5, using feature flags/stubs until then).
Dependencies: SGIP-3.1.1.2, SGIP-1.2.2.3
AC:

- Step indicator accurately reflects current step and overall progress.
- Each step's "Continue" is disabled until that step's minimum requirement is met (e.g., at least one skill added).
- Wizard is keyboard-navigable (Document 4 §16).

**SGIP-3.1.2.2 — Onboarding progress persistence (resume wizard where left off)** _(Story · P1 · S)_
Description: Persist the furthest-completed onboarding step on `StudentProfile` (or a small dedicated table) so a user who exits mid-onboarding resumes correctly.
Dependencies: SGIP-3.1.2.1
AC:

- Reloading the app mid-onboarding returns the user to their last incomplete step, not step 1.
- Completing onboarding marks it complete and routes to `/dashboard` on subsequent logins.

---

### SGIP-3.2 — Documents & Evidence _(Epic · P0 · XL)_

**Description:** Implement the secure file-upload pipeline (Document 3 §7) and resume/certificate/project-evidence management (FR-DOC-01 through FR-DOC-04).
**Dependencies:** SGIP-3.1, SGIP-1.1.3
**Acceptance Criteria:**

- Uploaded files are validated by content (magic bytes), size-limited, stored privately, and quarantined until scanned.
- Resume upload triggers async processing without blocking the UI (FR-DOC-02).
- Students can manage certificates and project evidence with skill tagging.

#### SGIP-3.2.1 — File Upload Pipeline _(Feature · P0 · L)_

**Description:** `StoragePort` abstraction over Cloudinary, content-validated upload endpoint, and virus-scan quarantine lifecycle (Document 3 §7).
**Dependencies:** SGIP-1.1.3.1, SGIP-2.1.4.1
**Acceptance Criteria:**

- All uploads pass through magic-byte validation and size limits before any storage write.
- Files are stored privately (signed-URL access only).
- Files remain `QUARANTINED` until scanned; infected files are rejected and removed.

**SGIP-3.2.1.1 — StoragePort abstraction + Cloudinary adapter (private/authenticated delivery)** _(Story · P0 · M)_
Description: Define a `StoragePort` interface (`upload`, `getSignedUrl`, `delete`) and implement a Cloudinary adapter using "authenticated" delivery type (Document 2 §9, Document 3 §7.2).
Dependencies: SGIP-1.1.3.1
AC:

- Files uploaded via the adapter are not publicly accessible by guessing a URL.
- `getSignedUrl` returns a time-limited URL only for the resource owner (or an admin with audited access).
- A second storage provider could be substituted by implementing `StoragePort` without changing calling code (interface verified via a mock implementation used in tests).

**SGIP-3.2.1.2 — Upload endpoint with magic-byte MIME validation, size limits, UUID storage keys** _(Story · P0 · M)_
Description: Generic upload endpoint used by resume/certificate/project-evidence features, validating actual file content (not extension/`Content-Type`), enforcing per-type size limits, and generating UUID storage keys (Document 3 §7.2).
Dependencies: SGIP-3.2.1.1, SGIP-1.2.1.2
AC:

- A renamed executable with a `.pdf` extension is rejected (magic-byte check).
- A file exceeding the configured size limit is rejected with a clear error before any storage write.
- Original filenames are stored as display metadata only, never as storage keys.

**SGIP-3.2.1.3 — Virus/malware scan integration (ScanPort) + QUARANTINED/AVAILABLE/REJECTED status lifecycle** _(Story · P0 · L)_
Description: Define `ScanPort`, integrate a scanning service/container, and implement the async status lifecycle: `QUARANTINED → AVAILABLE` (clean) or `QUARANTINED → REJECTED` (infected, file deleted, user notified, `AuditLog` entry) per Document 3 §7.1.
Dependencies: SGIP-3.2.1.2, SGIP-1.1.3.2
AC:

- A clean test file transitions to `AVAILABLE` and becomes downloadable/parseable.
- A test file flagged by the scanner (e.g., EICAR test signature) transitions to `REJECTED`, is deleted from storage, and the user is notified.
- A file remains inaccessible for parsing (Phase 7 resume processing) while `QUARANTINED`.
- Scan-service unavailability does **not** silently mark files `AVAILABLE` — files remain `QUARANTINED` and a retry is scheduled (Document 3 §7.2 #4).

#### SGIP-3.2.2 — Resume Management _(Feature · P0 · M)_

**Description:** Resume upload UI with async processing status, and resume list/delete (FR-DOC-01, FR-DOC-02).
**Dependencies:** SGIP-3.2.1
**Acceptance Criteria:**

- Resume upload completes (UI-wise) immediately; parsing status is shown asynchronously without blocking other actions.
- Deleting a resume removes both the DB record and the Cloudinary asset.

**SGIP-3.2.2.1 — Resume upload UI + async processing status indicator** _(Story · P0 · M)_
Description: Upload UI for resumes (PDF/DOCX) showing status progression: `Uploading → Quarantined/Scanning → Processing → Suggestions ready` (the last step ties into Phase 7's resume-parsing job, stubbed here with a placeholder "processing" state until Phase 7 lands).
Dependencies: SGIP-3.2.1.3, SGIP-1.2.2.3
AC:

- Upload UI never blocks the rest of the app while processing is in progress (Document 1 NFR).
- Status indicator updates via polling or push without requiring manual refresh.
- Failed scans (REJECTED) show an actionable message distinct from a generic error (Document 4 §14).

**SGIP-3.2.2.2 — Resume list/delete API + UI (cascading Cloudinary deletion)** _(Story · P0 · S)_
Description: List a student's uploaded resumes and allow deletion, with the `StoragePort.delete` call invoked alongside the DB row deletion (Document 1 §6 Data Retention).
Dependencies: SGIP-3.2.1.1, SGIP-3.2.2.1
AC:

- Deleting a resume removes the Cloudinary asset (verified via the storage adapter, not just the DB row).
- A student can have multiple resumes; the most recently processed one's suggestions are referenced by FR-DOC-02 in Phase 7.

#### SGIP-3.2.3 — Certificates & Project Evidence _(Feature · P1 · M)_

**Description:** Certificate and project-evidence upload with skill tagging (FR-DOC-03, FR-DOC-04).
**Dependencies:** SGIP-3.2.1, SGIP-4.2 (skill tagging requires the canonical skill list and student-skill associations)
**Acceptance Criteria:**

- A student can upload a certificate and tag it with a canonical skill, issue date, and issuer.
- A student can add project evidence (file and/or link) tagged with one or more skills.

**SGIP-3.2.3.1 — Certificate upload + skill-tagging API and UI (FR-DOC-03)** _(Story · P1 · M)_
Description: `Certificate` entity (file ref, skillId, issueDate, issuingOrganization) with upload + tagging UI.
Dependencies: SGIP-3.2.1.2, SGIP-4.1.1.2 (skill search for tagging)
AC:

- A certificate can be associated with exactly one canonical skill via search/autocomplete (Document 2 §6.3 fast-path alias matching applies here too).
- Certificate list displays issuer/date and links to the (signed) file.
- Per Document 1 §11 Assumption #2, certificate presence is tracked and surfaced as a UI badge but is explicitly **not** wired into the readiness score formula in this phase.

**SGIP-3.2.3.2 — Project evidence upload (file/link) + skill-tagging API and UI (FR-DOC-04)** _(Story · P1 · M)_
Description: `ProjectEvidence` entity supporting either a file upload or an external URL (GitHub/portfolio), tagged with one or more skills.
Dependencies: SGIP-3.2.1.2, SGIP-4.1.1.2
AC:

- A project can be tagged with multiple skills.
- External URLs are stored and displayed as links only — **no server-side fetching of arbitrary user-supplied URLs** is implemented (Document 3 §13, SSRF note — explicitly out of scope unless a future link-preview feature is built behind an allow-listed fetcher).

---

## Phase 4: Skills Management

### SGIP-4.1 — Skill Taxonomy (Canonical) _(Epic · P0 · L)_

**Description:** Canonical skill data model, seed taxonomy, search/autocomplete, and the embedding infrastructure that underpins the Normalization Engine (Phase 6).
**Dependencies:** SGIP-1.1.2
**Acceptance Criteria:**

- Canonical skills are searchable with typo tolerance.
- Each canonical skill has a computed embedding stored via `pgvector`, ready for similarity search.

#### SGIP-4.1.1 — Canonical Skill Data Model & Seed _(Feature · P0 · M)_

**Description:** `Skill`/`SkillAlias` schema (already partially scaffolded in SGIP-1.1.2.2/.3) finalized with category taxonomy, plus search API.
**Dependencies:** SGIP-1.1.2.3
**Acceptance Criteria:**

- Skills are categorized (e.g., "Frontend," "Backend," "DevOps," "Data," "Soft Skills") to support future filtering/browsing.
- Autocomplete returns relevant results for partial/misspelled input within acceptable latency.

**SGIP-4.1.1.1 — Skill/SkillAlias schema + initial seed dataset (hundreds of common skills with categories)** _(Story · P0 · M)_
Description: Expand the seed dataset from SGIP-1.1.2.3 to a broad initial taxonomy (target: several hundred skills across categories) with common aliases pre-populated (e.g., "JS" → "JavaScript", "TailwindCSS" → "Tailwind CSS").
Dependencies: SGIP-1.1.2.3
AC:

- Seed includes all skills referenced by the seeded role requirement sets (SGIP-1.1.2.3, SGIP-5.1.1.1).
- At least 10 high-frequency aliases are seeded to validate the alias-match fast path (Phase 6).
- Seed script remains idempotent.

**SGIP-4.1.1.2 — Skill search/autocomplete API (pg_trgm)** _(Story · P0 · M)_
Description: `GET /skills/search?q=...` using `pg_trgm` trigram similarity for typo-tolerant matching against `Skill.name` and `SkillAlias.name`.
Dependencies: SGIP-4.1.1.1
AC:

- Searching "Reactt" returns "React" within the top results.
- Search response time is acceptable for autocomplete use (sub-200ms on seeded dataset size).
- Results are deduplicated when a query matches both a skill name and one of its aliases.

#### SGIP-4.1.2 — Skill Embeddings _(Feature · P0 · L)_

**Description:** Local embedding model integration and `pgvector` similarity search for skills (Document 2 §6.3 Step 3).
**Dependencies:** SGIP-1.1.2.1, SGIP-1.1.3.2
**Acceptance Criteria:**

- Every canonical skill has a computed embedding stored on creation/seed.
- A cosine-similarity query against `Skill.embedding` returns sensibly-ranked results for a sample unmatched input.

**SGIP-4.1.2.1 — Local embedding model integration in worker process** _(Story · P0 · L)_
Description: Integrate a locally-hosted small embedding model (e.g., via `onnxruntime` or a sentence-transformers-compatible runtime) into the worker process, exposed as an internal `EmbeddingService` (Document 2 §6.3: deliberately not a Groq/LLM call).
Dependencies: SGIP-1.1.3.2
AC:

- `EmbeddingService.embed(text)` returns a fixed-dimension vector for arbitrary text without any external network call.
- Embedding generation works with AI providers (Groq) fully disabled/mocked, demonstrating the intended independence (Document 1 NFR).
- Model load time and per-call latency are measured and documented for capacity planning.

**SGIP-4.1.2.2 — pgvector setup + cosine similarity search query for skills** _(Story · P0 · M)_
Description: Add a `vector` column to `Skill` (raw-SQL migration per Document 2 §12), backfill embeddings for seeded skills (SGIP-4.1.2.1), and implement a parameterized cosine-similarity query returning top-N matches with similarity scores.
Dependencies: SGIP-4.1.2.1, SGIP-1.1.2.1
AC:

- A query for an unseeded synonym (e.g., "Reactjs Development") returns "React" as the top match with a similarity score above the auto-link threshold default (0.92).
- Query uses an appropriate `pgvector` index (HNSW/IVFFlat) — index creation is part of this migration, with a comment noting the Document 2 §15 future-retuning flag.
- Similarity-search query is parameterized (no string interpolation), per Document 3 §9.

---

### SGIP-4.2 — Student Skills _(Epic · P0 · L)_

**Description:** Student-facing skill CRUD with proficiency levels and provenance tracking (FR-SKILL-01 through FR-SKILL-05).
**Dependencies:** SGIP-4.1, SGIP-3.1
**Acceptance Criteria:**

- Students can add/remove skills with a proficiency level (1–5) and see their provenance (self vs. AI-suggested).
- Searching for a skill not in the taxonomy creates a candidate without blocking the student.

#### SGIP-4.2.1 — Student Skill CRUD _(Feature · P0 · M)_

**Description:** Add/remove `StudentSkill`, update proficiency, and the Skill Proficiency Chip UI (Document 4 §9.7).
**Dependencies:** SGIP-4.1.1.2, SGIP-2.1.4.3
**Acceptance Criteria:**

- A student can add a skill with a proficiency level, edit the level, and remove the skill.
- UI reflects the skill's `source` (`SELF`/`AI_CONFIRMED`/`AI_SUGGESTED_PENDING`) per FR-SKILL-03.

**SGIP-4.2.1.1 — Add/remove StudentSkill API (FR-SKILL-01, FR-SKILL-04)** _(Story · P0 · M)_
Description: `POST/DELETE /students/me/skills` linking a `StudentProfile` to a `Skill` with an initial proficiency and `source=SELF, status=CONFIRMED`.
Dependencies: SGIP-4.1.1.2, SGIP-2.1.4.3
AC:

- A student cannot add the same skill twice (unique constraint on `studentProfileId + skillId`; re-adding updates proficiency instead).
- Removing a skill is a hard delete of the `StudentSkill` row (not soft-delete — distinct from the `User`/taxonomy soft-delete policy in Document 2 §12, since `StudentSkill` history isn't independently meaningful outside of `ReadinessSnapshot`, which already captures point-in-time state).
- Ownership-checked: a student cannot modify another student's `StudentSkill` rows.

**SGIP-4.2.1.2 — Proficiency update API (FR-SKILL-02, 1–5 scale validation)** _(Story · P0 · S)_
Description: `PATCH /students/me/skills/{skillId}` updating `proficiency` (validated 1–5).
Dependencies: SGIP-4.2.1.1
AC:

- Proficiency values outside 1–5 are rejected with a field-level validation error.
- Updating proficiency updates `StudentSkill.updatedAt`, used later (Phase 6) as a recalculation trigger.

**SGIP-4.2.1.3 — Student Skills UI — Skill Proficiency Chip + add-skill search (Document 4 §9.7)** _(Story · P0 · M)_
Description: Build the `/skills` page: list of `Skill Proficiency Chip` components (skill name, 5-segment proficiency indicator, source icon, inline editor) and an add-skill search/autocomplete using SGIP-4.1.1.2.
Dependencies: SGIP-4.2.1.1, SGIP-4.2.1.2, SGIP-1.2.2.2
AC:

- Inline proficiency editor updates via SGIP-4.2.1.2 with optimistic UI feedback (per Document 2 §8.2, optimistic updates are acceptable here since this is not the readiness score itself).
- Source icon distinguishes `SELF` vs `AI_CONFIRMED` per FR-SKILL-03 (AI-confirmed states wired fully once Phase 7 lands; UI supports the state now).
- Empty state ("Add your first skill...") matches Document 4 §15.

#### SGIP-4.2.2 — Skill Candidate Submission _(Feature · P0 · M)_

**Description:** When a search misses, create a `SkillCandidate` and trigger the Normalization Engine (FR-SKILL-05), while immediately giving the student a usable result.
**Dependencies:** SGIP-4.2.1, SGIP-6.1 (Normalization Engine) — _note: this story can be built against the Normalization Engine's public interface, with the engine's internals (Phase 6) landing in parallel; the interface contract should be agreed before Phase 6 begins._
**Acceptance Criteria:**

- A search for a skill not in the taxonomy results in a provisional link to the nearest match (if any) plus a `SkillCandidate`/`NormalizationReviewItem` created for admin review.

**SGIP-4.2.2.1 — Skill candidate creation on search-miss, triggering Normalization Engine (FR-SKILL-05)** _(Story · P0 · M)_
Description: When `GET /skills/search` returns no high-confidence match for a free-text submission, call `NormalizationEngine.normalize(text, entityType=SKILL)` (Document 2 §6.3) and surface the provisional result to the student.
Dependencies: SGIP-4.2.1.1, SGIP-6.1.1.2
AC:

- A genuinely novel skill name results in a `SkillCandidate` + `NormalizationReviewItem(status=PENDING)`.
- The student is shown a provisional link (per Document 2 §6.3 confidence routing) and can proceed to add it as a `StudentSkill` against the provisional target without waiting for admin review.
- Re-submitting the same novel text does not create duplicate `SkillCandidate` rows (idempotent on normalized input text).

---

## Phase 5: Career Roles

### SGIP-5.1 — Role Taxonomy (Canonical) _(Epic · P0 · L)_

**Description:** Canonical role data model, seed taxonomy, search, and versioned role-requirement sets (Document 2 §4.4, FR-ROLE-03/04).
**Dependencies:** SGIP-4.1
**Acceptance Criteria:**

- Canonical roles are searchable with typo tolerance and have embeddings for similarity search.
- Each role has at least one versioned `RoleRequirementSet` with `REQUIRED`/`IMPORTANT`/`NICE_TO_HAVE` requirements.
- Admins can create a new requirement-set version without mutating history.

#### SGIP-5.1.1 — Canonical Role Data Model & Seed _(Feature · P0 · M)_

**Description:** `Role`/`RoleAlias` schema, seed dataset, search API, and embeddings (mirroring SGIP-4.1 for roles).
**Dependencies:** SGIP-1.1.2.3, SGIP-4.1.2.1
**Acceptance Criteria:**

- Initial seed includes common roles (e.g., Full Stack Developer, AI Engineer, Data Analyst, DevOps Engineer, Mobile Developer) with aliases.
- Role search and similarity search work analogously to skill search (SGIP-4.1.1.2/4.1.2.2).

**SGIP-5.1.1.1 — Role/RoleAlias schema + initial seed dataset (common roles)** _(Story · P0 · M)_
Description: Seed canonical roles with common aliases (e.g., "AI Engineer" ↔ "Artificial Intelligence Engineer", per Document 1's worked example) and compute/store embeddings.
Dependencies: SGIP-4.1.2.1
AC:

- Seed includes the "AI Engineer"/"Artificial Intelligence Engineer" alias pair as a concrete validation case for Phase 6's normalization tests.
- Each seeded role has a non-null embedding.

**SGIP-5.1.1.2 — Role search/autocomplete API** _(Story · P0 · S)_
Description: `GET /roles/search?q=...` analogous to SGIP-4.1.1.2.
Dependencies: SGIP-5.1.1.1
AC:

- Behaves identically in structure/performance characteristics to the skill search endpoint (shared implementation pattern, per Document 2 §6.3's "generalized normalization" philosophy extended to search where reasonable).

#### SGIP-5.1.2 — Role Requirement Sets (Versioned) _(Feature · P0 · L)_

**Description:** `RoleRequirementSet`/`RoleRequirement` schema, versioning logic, and the admin requirement-set editor API (Document 2 §4.4, FR-ROLE-03/04, FR-ADMIN-03).
**Dependencies:** SGIP-5.1.1, SGIP-4.1.1
**Acceptance Criteria:**

- Creating a new requirement-set version deactivates the previous version without deleting it.
- `ReadinessSnapshot` (Phase 6) can reference a specific `requirementSetId` regardless of later edits.

**SGIP-5.1.2.1 — RoleRequirementSet/RoleRequirement schema (Document 2 §4.4)** _(Story · P0 · M)_
Description: Finalize the schema for versioned requirement sets: `RoleRequirementSet(roleId, version, isActive, effectiveFrom)` and `RoleRequirement(requirementSetId, skillId, importance, targetProficiency)`.
Dependencies: SGIP-5.1.1.1, SGIP-4.1.1.1
AC:

- Only one `RoleRequirementSet` per `roleId` has `isActive=true` at a time (enforced at the application layer with a transactional check; documented if a DB constraint is also feasible).
- `RoleRequirement.targetProficiency` validated 1–5; `importance` is an enum (`REQUIRED`/`IMPORTANT`/`NICE_TO_HAVE`).

**SGIP-5.1.2.2 — Requirement-set versioning logic (create new version, deactivate previous, preserve history)** _(Story · P0 · M)_
Description: Service method `createNewRequirementSetVersion(roleId, requirements[])` that creates a new `RoleRequirementSet` (version = previous + 1), copies-and-modifies requirements as specified, and sets the previous version `isActive=false` — all within a single transaction.
Dependencies: SGIP-5.1.2.1
AC:

- After creating version 2, version 1 remains queryable (e.g., for historical `ReadinessSnapshot` interpretation) but `isActive=false`.
- The operation is atomic — a failure partway through leaves no role with zero active requirement sets.

**SGIP-5.1.2.3 — Admin requirement-set editor API (CRUD requirements within a draft version)** _(Story · P0 · M)_
Description: Admin-only API to draft a new requirement-set version (add/remove/edit requirements) and publish it via SGIP-5.1.2.2 (FR-ADMIN-03).
Dependencies: SGIP-5.1.2.2, SGIP-2.1.4.1
AC:

- Only `ADMIN` role can access this API (permission matrix §2.3).
- Publishing a draft is an explicit, auditable action (writes to `AuditLog` with before/after diff per Document 2 §4.1/§6.2).

---

### SGIP-5.2 — Student Target Roles _(Epic · P0 · M)_

**Description:** Student-facing target role selection with normalization-pipeline integration (FR-ROLE-01, FR-ROLE-02), capped at 3 active roles (PRD Open Question #3).
**Dependencies:** SGIP-5.1, SGIP-4.2
**Acceptance Criteria:**

- A student can select up to 3 active target roles.
- A search miss results in a role candidate plus an immediately-usable provisional link.

#### SGIP-5.2.1 — Target Role Selection _(Feature · P0 · M)_

**Description:** Select/deselect target roles, role-candidate creation, and the selection UI (Document 4 §10 "role cards").
**Dependencies:** SGIP-5.1.1.2, SGIP-6.1 (for candidate creation, same parallel-build note as SGIP-4.2.2)
**Acceptance Criteria:**

- Selecting a 4th active target role is rejected with a clear message (or prompts the student to deactivate one first).
- Selection UI shows a mini readiness preview per role card once Phase 6 scoring is available (graceful placeholder until then).

**SGIP-5.2.1.1 — Select/deselect target role API (FR-ROLE-01, max-3 enforcement)** _(Story · P0 · M)_
Description: `POST/DELETE /students/me/target-roles` creating/deactivating `StudentTargetRole` rows, enforcing a maximum of 3 `isActive=true` rows per student.
Dependencies: SGIP-5.1.1.2, SGIP-2.1.4.3
AC:

- A 4th selection attempt while 3 are active returns a clear, actionable error (not a generic 400).
- Deselecting a role sets `isActive=false` rather than deleting the row (preserves historical `ReadinessSnapshot` linkage).

**SGIP-5.2.1.2 — Role candidate creation on search-miss (FR-ROLE-02)** _(Story · P0 · M)_
Description: Mirrors SGIP-4.2.2.1 for roles — on search-miss, call `NormalizationEngine.normalize(text, entityType=ROLE)` and surface the provisional canonical role per Document 2 §6.3's sequence diagram.
Dependencies: SGIP-5.2.1.1, SGIP-6.1.1.2
AC:

- The "AI Engineer" / "Artificial Intelligence Engineer" seeded alias case (SGIP-5.1.1.1) resolves via the alias fast path (no candidate created) — validating that aliases pre-empt unnecessary candidate creation.
- A genuinely novel role string creates a `RoleCandidate` + `NormalizationReviewItem` and provisionally links the student to the nearest canonical role, with messaging matching Document 1 §4.1 Step 5 / Open Question #4 ("Showing results for X (closest match). We've also logged Y for review.").

**SGIP-5.2.1.3 — Target role selection UI (role cards with mini readiness preview, search)** _(Story · P0 · M)_
Description: Build `/roles` page: searchable role list, "select as target" action, and role cards showing a mini readiness preview (full integration once SGIP-6.2 lands; this story builds the UI shell and wires it to a placeholder/zero-state score until then).
Dependencies: SGIP-5.2.1.1, SGIP-1.2.2.2
AC:

- Selected roles appear distinctly (e.g., a "Target" badge) and are reflected on `/dashboard` (Document 4 §10) once that page exists.
- The "provisional match" messaging from SGIP-5.2.1.2 is rendered per Document 1 §11 Open Question #4's recommended copy pattern.

---

## Phase 6: Gap Analysis Engine

> This phase implements the platform's core trust-bearing logic (Document 1 §1, Document 2 §4.5/§6.3). Two stories below (`SGIP-6.1.1.2` and `SGIP-6.2.1.1`) are decomposed into Tasks as worked examples — both because they are the highest-risk, highest-complexity items in the entire backlog, and because they are the items most likely to require careful code review and a higher test-coverage bar than average.

### SGIP-6.1 — Normalization Engine _(Epic · P0 · XL)_

**Description:** Generalized embedding-based normalization pipeline for skills and roles, with confidence-based routing and the admin review queue substrate (Document 2 §6.3).
**Dependencies:** SGIP-4.1.2, SGIP-1.1.3
**Acceptance Criteria:**

- A free-text input (skill or role) resolves via exact/alias match, embedding similarity, or candidate creation, per Document 2 §6.3's confidence table.
- `NormalizationReviewItem` rows are created for medium/low-confidence inputs, polymorphic across `entityType=SKILL|ROLE`.
- Thresholds (0.92/0.75 defaults) are configurable via `PlatformConfig`, not hardcoded.

#### SGIP-6.1.1 — Normalization Pipeline Core _(Feature · P0 · XL)_

**Description:** The end-to-end `NormalizationEngine.normalize(text, entityType)` flow consumed by Phases 4 and 5 (SGIP-4.2.2.1, SGIP-5.2.1.2).
**Dependencies:** SGIP-4.1.2.2, SGIP-1.1.2.2
**Acceptance Criteria:**

- The full Document 2 §6.3 sequence (Steps 1–4) is implemented and covered by integration tests for all three confidence bands.
- The "AI Engineer"/"Artificial Intelligence Engineer" seeded alias case (SGIP-5.1.1.1) resolves via Step 2 (alias match) without invoking embedding similarity.

**SGIP-6.1.1.1 — Exact/alias match fast path (case-insensitive, pg_trgm typo tolerance)** _(Story · P0 · M)_
Description: Implement Document 2 §6.3 Step 2 — case-insensitive exact match against `Skill.name`/`Role.name` and `*Alias.name`, with `pg_trgm`-based typo tolerance for near-exact matches (e.g., "Reactt").
Dependencies: SGIP-4.1.1.1, SGIP-5.1.1.1
AC:

- An exact or alias match short-circuits the pipeline — no embedding computation, no candidate creation, no AI call.
- A typo within trigram-similarity tolerance (e.g., "Reactt" → "React") resolves via this fast path, not Step 3.
- Performance: this path completes well within the <200ms scoring-adjacent latency budget noted in Document 1 NFR (this path is on the synchronous request path for skill/role search).

**SGIP-6.1.1.2 — Embedding similarity search + confidence-threshold routing** _(Story · P0 · XL — decomposed below)_
Description: Implement Document 2 §6.3 Steps 3–4: when no alias match exists, compute the input's embedding (SGIP-4.1.2.1) and route based on cosine similarity against existing `Skill.embedding`/`Role.embedding` rows.
Dependencies: SGIP-6.1.1.1, SGIP-4.1.2.2, SGIP-1.1.3.2
AC: (see constituent Tasks)

> **SGIP-6.1.1.2.1 — Similarity-search integration into the normalize() flow** _(Task · P0 · M)_
> Description: Wire `EmbeddingService.embed()` (SGIP-4.1.2.1) and the `pgvector` similarity query (SGIP-4.1.2.2) into `NormalizationEngine.normalize()`, returning the best match + similarity score for entityType-appropriate tables.
> Dependencies: SGIP-6.1.1.1, SGIP-4.1.2.2
> AC: Given a novel input string, the function returns the single best-matching canonical entity and a similarity score in [0,1], scoped correctly to `Skill` vs `Role` tables based on `entityType`.

> **SGIP-6.1.1.2.2 — Confidence-threshold routing logic (auto-link / provisional+candidate / candidate-only)** _(Task · P0 · M)_
> Description: Implement the three-band routing table from Document 2 §6.3 §Step 4: ≥0.92 auto-link; 0.75–0.92 provisional link + candidate + review item; <0.75 nearest-match-for-display + candidate + review item.
> Dependencies: SGIP-6.1.1.2.1, SGIP-6.1.1.4 (thresholds from PlatformConfig)
> AC: Three integration tests, one per band, each asserting (a) whether a `*Candidate`/`NormalizationReviewItem` is created, and (b) what link (if any) is returned to the caller. Auto-link band creates **no** candidate/review item.

> **SGIP-6.1.1.2.3 — Provisional-link re-pointing on admin resolution** _(Task · P0 · M)_
> Description: When an admin later approves-as-new, merges-as-alias, or rejects a `NormalizationReviewItem` (Phase 8, SGIP-8.1.2.2), any provisionally-linked `StudentSkill`/`StudentTargetRole` rows created against the _provisional_ target are re-pointed to the _final_ resolution (Document 2 §6.3 Step 5).
> Dependencies: SGIP-6.1.1.2.2, SGIP-8.1.2.2 (cross-phase; this task's acceptance can be tested against a stubbed admin-resolution call until Phase 8 lands)
> AC: After a "merge as alias" resolution, all `StudentSkill`/`StudentTargetRole` rows previously provisionally linked to the matched canonical entity remain correctly linked (no orphaning); after a "reject" resolution, those rows are flagged for the student to re-search (per Document 2 §6.3 Step 5).

**SGIP-6.1.1.3 — NormalizationReviewItem queue creation (polymorphic entityType SKILL|ROLE)** _(Story · P0 · M)_
Description: `NormalizationReviewItem(entityType, candidateId, proposedMatchId, confidenceScore, status, reviewerNote)` shared queue table (Document 2 §4.3), created by SGIP-6.1.1.2.2 for medium/low-confidence inputs.
Dependencies: SGIP-6.1.1.2.2
AC:

- A single queue table serves both skill and role candidates — verified by querying both types through one endpoint (used by Phase 8's admin UI).
- `status` transitions (`PENDING → APPROVED|MERGED|REJECTED`) are enforced (no invalid transitions, e.g., re-resolving an already-resolved item).

**SGIP-6.1.1.4 — PlatformConfig-driven similarity thresholds (configurable 0.92/0.75 defaults)** _(Story · P0 · S)_
Description: Store the auto-link (0.92) and review (0.75) thresholds in `PlatformConfig`, with the defaults seeded, and read by SGIP-6.1.1.2.2 at request time (not cached indefinitely, so admin changes via Phase 8 take effect promptly).
Dependencies: SGIP-1.1.2.2
AC:

- Changing the threshold via `PlatformConfig` (even via direct DB update in this phase, before Phase 8's UI exists) changes routing behavior on the next normalization call without a redeploy.
- Threshold changes are themselves a candidate for `AuditLog` once Phase 8's config-change-history (SGIP-8.2.3.1) lands — flagged as a forward dependency, not blocking this story.

---

### SGIP-6.2 — Readiness Scoring Engine _(Epic · P0 · XL)_

**Description:** Implement the deterministic readiness score formula (Document 2 §4.5), snapshot persistence, and recalculation triggers — the platform's single most important computation.
**Dependencies:** SGIP-5.1.2, SGIP-4.2
**Acceptance Criteria:**

- The scoring formula matches Document 2 §4.5 exactly and is covered by a unit-test suite including edge cases.
- A `ReadinessSnapshot` is created/updated whenever a recalculation trigger fires, referencing the correct `requirementSetId`.
- Recalculation completes within the <200ms NFR for a single (student, role) pair, with no AI call in the path (Document 1 §6).

#### SGIP-6.2.1 — Deterministic Score Calculation _(Feature · P0 · XL)_

**Description:** The pure domain service implementing Document 2 §4.5's formula, its persistence, and its recalculation triggers.
**Dependencies:** SGIP-5.1.2.1, SGIP-4.2.1
**Acceptance Criteria:**

- `calculateReadiness(studentProfileId, roleId)` is a pure function of `StudentSkill` rows and the active `RoleRequirementSet`, with no hidden state or AI dependency.
- Importance weights (3/2/1 defaults) are read from `PlatformConfig`, not hardcoded (Document 2 §4.5).

**SGIP-6.2.1.1 — Implement scoring formula (Document 2 §4.5) as a pure, unit-tested domain service** _(Story · P0 · XL — decomposed below)_
Description: Implement the per-requirement `weight/achieved/contribution` calculation and the aggregate `ReadinessScore = 100 * (Σcontribution / Σmax)` formula exactly as specified in Document 2 §4.5, plus the MATCHED/PARTIAL/MISSING classification.
Dependencies: SGIP-5.1.2.1, SGIP-4.2.1.2
AC: (see constituent Tasks)

> **SGIP-6.2.1.1.1 — Per-requirement contribution/achieved calculation** _(Task · P0 · M)_
> Description: For a given `RoleRequirement` and the student's `StudentSkill.proficiency` (or 0 if absent), compute `achieved = min(studentProficiency, targetProficiency) / targetProficiency` and `contribution = weight * achieved`, where `weight` comes from `PlatformConfig` per `importance` (Document 2 §4.5).
> Dependencies: SGIP-5.1.2.1
> AC: Unit tests cover: student proficiency = 0 (achieved=0), student proficiency = target (achieved=1), student proficiency > target (achieved capped at 1, not >1), and each `importance` band's weight is read from config correctly.

> **SGIP-6.2.1.1.2 — Aggregate score calculation + MATCHED/PARTIAL/MISSING classification** _(Task · P0 · M)_
> Description: Sum `contribution(r)` and `maxContribution(r)` across all requirements in the active `RoleRequirementSet`, compute `ReadinessScore = 100 * Σcontribution/Σmax`, and classify each requirement per Document 2 §4.5's MATCHED/PARTIAL/MISSING rules.
> Dependencies: SGIP-6.2.1.1.1
> AC: Unit tests cover: a role with zero requirements (must not divide by zero — define and test the explicit behavior, e.g., score is undefined/null with a clear domain-level signal rather than `NaN`/`Infinity`), a student meeting 100% of requirements (score = 100, all MATCHED), a student with zero relevant skills (score = 0, all MISSING), and a mixed case matching a hand-calculated expected value.

> **SGIP-6.2.1.1.3 — Unit test suite covering formula edge cases** _(Task · P0 · S)_
> Description: Consolidate and extend the tests from the two prior tasks into a single, comprehensive, documented test suite that serves as the executable specification for Document 2 §4.5 — referenced by Document 1 §11 as the "reproducible" guarantee.
> Dependencies: SGIP-6.2.1.1.2
> AC: Test suite includes a table-driven set of (skills, requirements, expected score, expected breakdown) fixtures reviewable by a non-engineer stakeholder (e.g., Product) to confirm the formula matches their expectations — this is the artifact used to "sign off" on the scoring algorithm before it ships.

**SGIP-6.2.1.2 — ReadinessSnapshot persistence with breakdown JSONB** _(Story · P0 · M)_
Description: Persist `ReadinessSnapshot(studentTargetRoleId, requirementSetId, score, breakdown, calculatedAt)` where `breakdown` is the JSONB structure produced by SGIP-6.2.1.1.2 (Document 2 §4.4/§12).
Dependencies: SGIP-6.2.1.1
AC:

- `breakdown` JSONB contains, per requirement: `skillId`, `importance`, `targetProficiency`, `studentProficiency`, `classification` — sufficient to render the Gap Report Matrix (SGIP-6.2.2.2) without re-querying `RoleRequirement` (Document 2 §4.4 rationale: stability against later requirement edits).
- Each snapshot references the `requirementSetId` active _at calculation time_, even if a newer version exists later.

**SGIP-6.2.1.3 — Recalculation triggers (skill change, role requirement change, target role change)** _(Story · P0 · L)_
Description: Wire `calculateReadiness` + snapshot persistence to fire on: `StudentSkill` add/remove/proficiency-update (SGIP-4.2.1.1/.2), `StudentTargetRole` creation (SGIP-5.2.1.1), and (for the _currently active_ requirement set only — bulk historical recalculation is SGIP-6.2.1.4) requirement-set version changes.
Dependencies: SGIP-6.2.1.2, SGIP-4.2.1.1, SGIP-4.2.1.2, SGIP-5.2.1.1
AC:

- Updating a `StudentSkill.proficiency` synchronously returns the updated score/breakdown in the same API response (Document 1 FR-SCORE-03), within the <200ms budget.
- Adding a new target role immediately produces an initial `ReadinessSnapshot` (score may be low/zero, but a snapshot exists — never "no snapshot yet" for an active target role).
- This trigger logic does **not** call the AI Gateway (architecture-boundary test from SGIP-1.2.1.3 covers this).

**SGIP-6.2.1.4 — Bulk recalculation background job for requirement-set updates** _(Story · P1 · L)_
Description: When an admin publishes a new `RoleRequirementSet` version (SGIP-5.1.2.2), enqueue a chunked background job recalculating `ReadinessSnapshot` for every `StudentTargetRole` referencing that role, per Document 2 §15 #2.
Dependencies: SGIP-6.2.1.3, SGIP-5.1.2.2, SGIP-1.1.3.2
AC:

- Job processes students in chunks (configurable batch size) to avoid DB connection-pool exhaustion (Document 2 §15).
- Job is idempotent/resumable — a worker restart mid-job does not produce duplicate snapshots or skip students (tracked via a job-progress marker).
- Job completion is observable (e.g., via the AI Usage/Operational dashboard's job-status view, Phase 8).

#### SGIP-6.2.2 — Gap Report _(Feature · P0 · M)_

**Description:** API and UI exposing the matched/partial/missing breakdown grouped by importance (Document 2 §4.5, Document 4 §9.2).
**Dependencies:** SGIP-6.2.1.2
**Acceptance Criteria:**

- Gap report groups requirements by `REQUIRED`/`IMPORTANT`/`NICE_TO_HAVE` with correct classification per requirement.
- Each PARTIAL/MISSING item links to its roadmap entry (once SGIP-6.3 lands).

**SGIP-6.2.2.1 — Gap Report API (matched/partial/missing breakdown grouped by importance)** _(Story · P0 · M)_
Description: `GET /students/me/target-roles/{id}/gap-report` returning the latest `ReadinessSnapshot.breakdown`, grouped/sorted by importance then by classification.
Dependencies: SGIP-6.2.1.2, SGIP-2.1.4.3
AC:

- Response structure matches the grouping expected by SGIP-6.2.2.2 (Document 4 §9.2's three collapsible sections).
- Ownership-checked per the permission matrix (a student cannot fetch another's gap report; an admin can, per §2.3's 🔶 cell, with the access logged per Document 3 §12).

**SGIP-6.2.2.2 — Gap Report Matrix UI component (Document 4 §9.2)** _(Story · P0 · L)_
Description: Build the Gap Report Matrix component — collapsible sections by importance, status icon + label (never color alone, Document 4 §16), proficiency-gap segmented bar, "View resources" link.
Dependencies: SGIP-6.2.2.1, SGIP-1.2.2.2
AC:

- Status icons/labels meet the accessibility requirements of Document 4 §16 (icon + text, not color alone).
- Proficiency segmented bar correctly renders current vs. target proficiency (1–5).
- Component renders correctly in the mobile "vertically grouped list" variant (Document 4 §6).

---

### SGIP-6.3 — Roadmap Generation & Progress Tracking _(Epic · P0 · L)_

**Description:** Deterministic roadmap prioritization (FR-ROADMAP-01/03) and the readiness-history/trend views (FR-SCORE-04).
**Dependencies:** SGIP-6.2
**Acceptance Criteria:**

- Roadmap items are generated in a deterministic priority order from a `ReadinessSnapshot`.
- Readiness history is queryable and rendered as a trend chart.

#### SGIP-6.3.1 — Roadmap Prioritization _(Feature · P0 · L)_

**Description:** Priority-ordering algorithm, `RoadmapItem` persistence/status, and the Roadmap Timeline UI (Document 4 §9.3).
**Dependencies:** SGIP-6.2.1.2
**Acceptance Criteria:**

- For a given snapshot, `RoadmapItem` rows are created in a deterministic, reproducible priority order.
- Marking an item complete requires explicit student confirmation before any proficiency change (FR-ROADMAP-03).

**SGIP-6.3.1.1 — Deterministic roadmap priority-ordering algorithm (importance × proficiency gap × prerequisite heuristic)** _(Story · P0 · L)_
Description: For each PARTIAL/MISSING requirement in a snapshot's breakdown, compute a priority score = `importanceWeight * proficiencyGap`, with a configurable "foundational-skill-first" tiebreaker heuristic (e.g., a `Skill.isFoundational` flag or category-based ordering, defined in this story).
Dependencies: SGIP-6.2.1.2
AC:

- Given a fixed snapshot, re-running the algorithm produces an identical ordering (determinism, mirroring SGIP-6.2.1.1.3's spirit).
- The "foundational-skill-first" heuristic is documented with its concrete rule (e.g., specific category ordering) so it can be reviewed/tuned by Product without code changes to the core formula.

**SGIP-6.3.1.2 — RoadmapItem persistence + status tracking (TODO/IN_PROGRESS/DONE)** _(Story · P0 · M)_
Description: Persist `RoadmapItem(readinessSnapshotId, skillId, priorityOrder, status)`, generated alongside each new snapshot (SGIP-6.2.1.3).
Dependencies: SGIP-6.3.1.1, SGIP-6.2.1.3
AC:

- Each new snapshot generates a fresh set of `RoadmapItem` rows; prior snapshots' items remain queryable for history (SGIP-6.3.2.1).
- Status updates are a separate, student-initiated API call (SGIP-6.3.1.3), not automatically inferred from skill changes.

**SGIP-6.3.1.3 — Roadmap UI — Roadmap Timeline component + status-change confirmation dialog (FR-ROADMAP-03)** _(Story · P0 · L)_
Description: Build the Roadmap Timeline (Document 4 §9.3) and the "mark complete" confirmation dialog that asks the student to confirm a proficiency update (e.g., "Update your React proficiency to Intermediate?") before applying it via SGIP-4.2.1.2.
Dependencies: SGIP-6.3.1.2, SGIP-4.2.1.2, SGIP-1.2.2.2
AC:

- Completing a roadmap item never silently changes `StudentSkill.proficiency` — the confirmation dialog is mandatory (FR-ROADMAP-03).
- Declining the proficiency update still marks the `RoadmapItem.status = DONE` if the student explicitly chooses "mark done without updating skill" (an explicit secondary option, to avoid forcing an inaccurate self-report).

#### SGIP-6.3.2 — Progress Tracking _(Feature · P0 · M)_

**Description:** Readiness history API and trend chart (FR-SCORE-04, Document 4 §10).
**Dependencies:** SGIP-6.2.1.2
**Acceptance Criteria:**

- A student can view their readiness score history per target role over time.
- The trend chart correctly handles a role-requirement-set version change occurring within the displayed range (Document 2 §4.4).

**SGIP-6.3.2.1 — Readiness history API (snapshot list per target role)** _(Story · P0 · M)_
Description: `GET /students/me/target-roles/{id}/history` returning `ReadinessSnapshot` rows (score, calculatedAt, requirementSetId) ordered by time.
Dependencies: SGIP-6.2.1.2
AC:

- Response includes the `requirementSetId`/`version` per snapshot so the UI can render the "requirements changed on [date]" annotation (Document 2 §4.4).
- Pagination/date-range filtering supported for students with long history.

**SGIP-6.3.2.2 — Readiness trend chart UI (Recharts, multi-role)** _(Story · P0 · M)_
Description: Build the dashboard trend chart (Document 4 §10, Row 3) — multi-line Recharts chart, one line per active target role, with the requirement-set-version annotation from SGIP-6.3.2.1.
Dependencies: SGIP-6.3.2.1, SGIP-1.2.2.2
AC:

- Each role's line uses a distinct `--accent`-derived color (not semantic status colors, per Document 4 §10).
- A version-change annotation is visible on the chart at the relevant date, with an accessible text equivalent (tooltip/label, not hover-only).

---

## Phase 7: AI Features

### SGIP-7.1 — AI Gateway _(Epic · P0 · XL)_

**Description:** Provider-agnostic AI abstraction layer (Document 2 §7.1), async job infrastructure, and usage telemetry — the foundation for all AI-powered capabilities.
**Dependencies:** SGIP-1.1.3, SGIP-1.2.1
**Acceptance Criteria:**

- `AIGatewayService` exposes feature-level methods only; no domain module calls a provider SDK directly (architecture-boundary enforced).
- Circuit breaker and response cache demonstrably allow core flows to remain functional with the configured provider unavailable (Document 1 §6 NFR, validated via a synthetic "AI outage" test per PRD §7 Success Metrics).

#### SGIP-7.1.1 — Provider Abstraction _(Feature · P0 · XL)_

**Description:** `AIProviderPort`, `GroqAdapter`, `ProviderRouter`, `CircuitBreaker`, `ResponseCache`, and `AIUsageLog` (Document 2 §7.1).
**Dependencies:** SGIP-1.1.3.1, SGIP-1.3.1.2 (telemetry attribute reservations)
**Acceptance Criteria:**

- Adding a second provider (e.g., a mock/test adapter) requires implementing `AIProviderPort` only — no changes to `AIGatewayService`'s public interface or to any domain module.
- A simulated provider outage causes the circuit breaker to open and fall back per the configured chain, logged to `AIUsageLog`.

**SGIP-7.1.1.1 — AIProviderPort interface + GroqAdapter implementation** _(Story · P0 · M)_
Description: Define `AIProviderPort.complete(prompt, options)` and implement `GroqAdapter` against the Groq API.
Dependencies: SGIP-1.1.3.3 (secrets for API key)
AC:

- `GroqAdapter` correctly handles Groq-specific request/response shapes behind the generic interface.
- API key sourced from secrets management (Document 2 §11), never hardcoded.

**SGIP-7.1.1.2 — ProviderRouter with per-feature, PlatformConfig-driven provider selection + fallback chain** _(Story · P0 · M)_
Description: `ProviderRouter.getActiveProvider(feature)` reads `PlatformConfig` to select a provider per feature (Document 2 §7.1), with a configurable fallback chain.
Dependencies: SGIP-7.1.1.1, SGIP-1.1.2.2
AC:

- Two different features can be configured to use different providers without code changes (verified with `GroqAdapter` + a test/mock adapter).
- If the primary provider for a feature is unavailable (circuit open, SGIP-7.1.1.3), the router selects the next provider in the configured chain.

**SGIP-7.1.1.3 — CircuitBreaker per provider with configurable thresholds and OPEN/HALF_OPEN/CLOSED states** _(Story · P0 · M)_
Description: Implement a circuit breaker wrapping `AIProviderPort.complete()` calls, with failure-count/time-window thresholds configurable via `PlatformConfig`, transitioning `CLOSED → OPEN → HALF_OPEN → CLOSED/OPEN`.
Dependencies: SGIP-7.1.1.2
AC:

- Exceeding the failure threshold opens the circuit; subsequent calls fail fast (no network call) until the reset timeout elapses.
- A successful call in `HALF_OPEN` closes the circuit; a failure re-opens it.
- Circuit state transitions are logged and exposed for SGIP-8.2.4 (AI Usage Dashboard).

**SGIP-7.1.1.4 — Redis-backed ResponseCache for AI Gateway feature methods** _(Story · P1 · M)_
Description: Cache deterministic-ish AI Gateway outputs (e.g., "learning resources for skill X at level Y") in Redis with a configurable TTL (Document 2 §7.1).
Dependencies: SGIP-1.1.3.1, SGIP-7.1.1.2
AC:

- A repeated request for the same (feature, cache-key) within the TTL returns the cached response without a provider call (verified via `AIUsageLog` showing no new call).
- Cache keys are constructed to avoid leaking one student's AI output to another where the content is student-specific (cache key includes relevant scoping, e.g., skill+level for resource suggestions is safe to share across students; per-student content like resume extraction is never cached this way).

**SGIP-7.1.1.5 — AIUsageLog telemetry (provider, feature, tokens, latency, cost, success/failure)** _(Story · P0 · M)_
Description: Record every AI Gateway call (cache hits optionally excluded or flagged) to `AIUsageLog`, populating the OpenTelemetry span attributes reserved in SGIP-1.3.1.2.
Dependencies: SGIP-7.1.1.1, SGIP-1.3.1.2
AC:

- Every provider call (success or failure) produces an `AIUsageLog` row with provider, feature, token counts (if available from the provider response), latency, and an estimated cost.
- Data is queryable in a form usable by SGIP-8.2.4's aggregation API.

#### SGIP-7.1.2 — Async Job Processing _(Feature · P0 · L)_

**Description:** BullMQ job processors for the four AI-backed async jobs (Document 2 §7.2 table) with idempotent upsert patterns.
**Dependencies:** SGIP-1.1.3.2, SGIP-7.1.1
**Acceptance Criteria:**

- All four job types (`resume.parse`, `normalization.embed`, `roadmap.enrich`, `score.explain`) are registered and processable.
- Re-running any job (e.g., after a worker crash) does not create duplicate output rows.

**SGIP-7.1.2.1 — BullMQ job processors for resume.parse, normalization.embed, roadmap.enrich, score.explain** _(Story · P0 · L)_
Description: Implement the four job processors per Document 2 §7.2's table, each calling the appropriate `AIGatewayService` feature method (or, for `normalization.embed`, the non-AI `EmbeddingService` from SGIP-4.1.2.1).
Dependencies: SGIP-1.1.3.2, SGIP-7.1.1.2, SGIP-4.1.2.1
AC:

- Each job type has its own queue/processor and can be triggered independently (verified by enqueuing each in isolation in tests).
- `normalization.embed` does not call `AIGatewayService` (architecture-boundary consideration — embeddings are local per Document 2 §6.3).

**SGIP-7.1.2.2 — Idempotent upsert patterns for all job outputs** _(Story · P0 · M)_
Description: Ensure each processor `upsert`s its output (e.g., `StudentSkill` from resume parsing, `RoadmapItem.resources`, `ReadinessSnapshot.aiExplanation`) keyed by entity ID + a version/generation marker, so re-runs are safe.
Dependencies: SGIP-7.1.2.1
AC:

- Manually re-enqueuing a completed job does not create duplicate `StudentSkill`/`RoadmapItem` rows or duplicate notifications.
- A test simulates a worker crash mid-job (e.g., kill after partial writes) and verifies a re-run completes correctly without duplication.

---

### SGIP-7.2 — AI-Powered Capabilities _(Epic · P0 · XL)_

**Description:** The user-facing AI features — resume parsing, readiness explanations, roadmap recommendations, normalization disambiguation — each with a deterministic fallback per Document 2 §7.3.
**Dependencies:** SGIP-7.1, SGIP-6.1, SGIP-6.2, SGIP-6.3
**Acceptance Criteria:**

- Each AI-powered feature has a verified non-AI fallback that activates when the circuit breaker is open.
- AI-suggested skills are never auto-confirmed (FR-SKILL-03, Document 3 §10).

#### SGIP-7.2.1 — Resume Parsing & Skill Extraction _(Feature · P0 · L)_

**Description:** Text extraction, AI skill extraction with schema validation and prompt-injection mitigations, and the human-confirmation UI (FR-DOC-02, FR-SKILL-03, Document 3 §10).
**Dependencies:** SGIP-3.2.2.1, SGIP-7.1.2.1
**Acceptance Criteria:**

- A scanned-clean resume produces a set of `StudentSkill(status=PENDING_REVIEW, source=AI_SUGGESTED)` rows.
- A malformed or schema-non-conforming AI response is rejected without creating any `StudentSkill` rows, and the job fails gracefully (notifying the student that no suggestions were found, not erroring visibly).

**SGIP-7.2.1.1 — Text extraction from PDF/DOCX resumes (non-AI library step)** _(Story · P0 · M)_
Description: Extract plain text from `AVAILABLE`-status resumes using a text-extraction library (no AI), run in the `resume.parse` job (SGIP-7.1.2.1) within resource limits.
Dependencies: SGIP-3.2.1.3 (only `AVAILABLE` files processed), SGIP-7.1.2.1
AC:

- Text extraction runs in a resource-limited context (timeout, memory cap) — a malformed PDF cannot hang or crash the worker (Document 3 §7.2 #5).
- Extraction output is passed to SGIP-7.2.1.2 as plain text only — no embedded objects/macros are processed.

**SGIP-7.2.1.2 — AI skill-extraction prompt + schema validation + prompt-injection mitigations** _(Story · P0 · L)_
Description: Construct the resume-extraction prompt with untrusted-content delimiters (Document 3 §10), call `AIGatewayService.extractSkillsFromResume(text)`, and validate the response against a `SkillExtraction[]` schema (zod/class-validator) before any further processing.
Dependencies: SGIP-7.2.1.1, SGIP-7.1.1.2
AC:

- A response that doesn't conform to the expected schema is discarded entirely (no partial application) and logged as an extraction failure.
- A test resume containing an injected instruction (per Document 3 §10's example) results, at most, in spurious _skill suggestions_ — never in any effect outside the `SkillExtraction[]` schema's expressive power (verified by a test asserting no other system state changes).
- Extracted skill names are passed through the Normalization Engine (SGIP-6.1.1) — i.e., this story integrates with, not bypasses, taxonomy normalization.

**SGIP-7.2.1.3 — PENDING_REVIEW StudentSkill creation + confirmation UI (FR-SKILL-03)** _(Story · P0 · M)_
Description: Create `StudentSkill(status=PENDING_REVIEW, source=AI_SUGGESTED)` rows from validated extractions (with an initial AI-suggested proficiency the student can adjust), and build the confirmation UI ("Resume processed — review 6 suggested skills") where the student accepts (→ `CONFIRMED`) or rejects (→ deleted) each.
Dependencies: SGIP-7.2.1.2, SGIP-4.2.1.1, SGIP-6.1.1.2
AC:

- `PENDING_REVIEW` skills do **not** contribute to `ReadinessSnapshot` calculations (SGIP-6.2.1.1 only considers `CONFIRMED` rows) — verified by a test adding a `PENDING_REVIEW` skill and confirming the score is unchanged until confirmation.
- Confirming a suggestion sets `status=CONFIRMED, source=AI_CONFIRMED` and triggers a recalculation (SGIP-6.2.1.3).
- A notification (in-app, optionally email per Document 2 §7.2) informs the student when suggestions are ready.

#### SGIP-7.2.2 — Readiness Explanation _(Feature · P1 · M)_

**Description:** AI-generated natural-language score explanations with a template-based fallback (FR-SCORE-05, Document 2 §7.3, Document 4 §9.6).
**Dependencies:** SGIP-6.2.1.2, SGIP-7.1.2.1
**Acceptance Criteria:**

- Every `ReadinessSnapshot` has a usable explanation immediately (template), with an AI-generated explanation arriving asynchronously as an enhancement.
- With the AI provider unavailable, the template explanation remains and no error is shown in its place.

**SGIP-7.2.2.1 — AI explanation prompt (score.explain job) + template-based fallback generator** _(Story · P1 · M)_
Description: Implement `AIGatewayService.explainReadinessScore(breakdown)` (called by the `score.explain` job) and a separate, always-available template-string generator (e.g., "You're at {score}% for {role} — your strongest area is {topMatchedCategory}; your biggest gaps are {topMissingSkills}.") used synchronously at snapshot-creation time.
Dependencies: SGIP-6.2.1.2, SGIP-7.1.2.1
AC:

- The template explanation is generated synchronously and stored alongside the snapshot — never blank.
- The AI explanation, when it arrives, replaces/augments the template in `ReadinessSnapshot.aiExplanation` without modifying the deterministic `score`/`breakdown` fields.
- With the circuit breaker open (simulated), the template explanation is the only one shown, and the UI does not show an error for the missing AI explanation (ties to SGIP-7.2.2.2's design).

**SGIP-7.2.2.2 — "AI Insight" UI treatment for explanations (Document 4 §9.6)** _(Story · P1 · M)_
Description: Build the "AI Insight" visual treatment (small AI label, left-border accent, scoped skeleton while pending, cross-fade on arrival) applied to the explanation block on the role-overview page.
Dependencies: SGIP-7.2.2.1, SGIP-1.2.2.2
AC:

- While `score.explain` is pending, only the explanation block shows a skeleton — the score, gap report, and roadmap are fully interactive (Document 2 §7.3).
- If the AI explanation never arrives (provider down), the block displays the template explanation with no "AI" label and no error state (per Document 4 §14's "AI suggestions are temporarily unavailable... your readiness score and gap report are unaffected" pattern — adapted here to simply show the template seamlessly, per Document 2 §7.3's "user never sees a spinner blocking a core number").

#### SGIP-7.2.3 — Roadmap Resource Recommendations _(Feature · P1 · M)_

**Description:** AI-suggested learning resources per roadmap item, with an admin-curated fallback list (FR-ROADMAP-02).
**Dependencies:** SGIP-6.3.1.2, SGIP-7.1.2.1
**Acceptance Criteria:**

- Every roadmap item has _some_ resources shown — AI-suggested if available, curated default otherwise.
- Admins can manage the default resource list per skill.

**SGIP-7.2.3.1 — AI resource-suggestion prompt (roadmap.enrich job) + curated fallback list per skill** _(Story · P1 · M)_
Description: Implement `AIGatewayService.suggestLearningResources(skill, level)` (via `roadmap.enrich`) and a `DefaultSkillResource` table (admin-managed, SGIP-7.2.3.2) used when AI is unavailable or for skills with no AI suggestions yet.
Dependencies: SGIP-6.3.1.2, SGIP-7.1.1.4 (caching — resource suggestions for a given skill+level are cacheable across students per Document 2 §7.1)
AC:

- A `RoadmapItem` for a skill with no `DefaultSkillResource` entries and AI unavailable shows an honest "no resources available yet" state (Document 4 §15 empty-state philosophy) rather than nothing or an error.
- AI-suggested resources are cached (SGIP-7.1.1.4) by (skill, level) — not duplicated per student.

**SGIP-7.2.3.2 — Admin default-resource management UI** _(Story · P2 · M)_
Description: Admin UI to CRUD `DefaultSkillResource` entries (skill, resource title/URL/type), used as the fallback in SGIP-7.2.3.1.
Dependencies: SGIP-7.2.3.1, SGIP-2.1.4.1
AC:

- Admin can add/edit/remove default resources per skill.
- Changes take effect for roadmap items immediately (no caching of the _default list itself_ beyond normal page-load caching).

#### SGIP-7.2.4 — Normalization Disambiguation _(Feature · P2 · S)_

**Description:** Optional AI-generated disambiguation notes for close-call normalization matches, advisory-only (Document 2 §6.3 Step 6).
**Dependencies:** SGIP-6.1.1.3, SGIP-7.1.1.4
**Acceptance Criteria:**

- The normalization review queue (Phase 8) functions identically with or without this feature enabled.

**SGIP-7.2.4.1 — AI disambiguation-note generation for close-call normalization matches (cached, advisory-only)** _(Story · P2 · M)_
Description: For `NormalizationReviewItem`s with similarity scores in a "close call" band (configurable), generate a one-line AI explanation of why the candidate might map to one or another canonical entity, cached and read-only.
Dependencies: SGIP-6.1.1.3, SGIP-7.1.1.4
AC:

- This note is never used to make the routing decision itself (architecture-boundary: SGIP-6.1.1.2.2 does not depend on this story).
- With AI unavailable, the review item displays without the note and remains fully actionable by the admin.

---
