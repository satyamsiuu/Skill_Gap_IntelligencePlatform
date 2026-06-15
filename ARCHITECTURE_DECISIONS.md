# SGIP — Architecture Decisions Record (ADR)

**Purpose:** Immutable record of every architectural decision made. Future sessions MUST read this file before making any architectural choices. These decisions govern all code written for this project.

---

## ADR Format

### ADR-[number]: [Title]

**Date:** [timestamp]
**Status:** ACCEPTED | SUPERSEDED | DEPRECATED
**Context:** [Why this decision needed to be made]
**Decision:** [What was decided]
**Consequences:** [What this means for future development]
**Source:** [Document and section that mandates or justifies this]

---

## Foundation ADRs (Pre-Seeded from Project Documents)

### ADR-001: Modular Monolith Architecture

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Need to balance operational simplicity at MVP stage with clean extraction path for future microservices.
**Decision:** Single NestJS application composed of strongly-isolated modules + a separate worker process sharing the same codebase. Module boundaries map 1:1 to eventual service boundaries.
**Consequences:** Each module must be independently testable. No module may import from another in violation of the dependency graph in Document 2, Section 3.
**Source:** Document 2, Section 1

---

### ADR-002: Deterministic Scoring — Zero AI Dependency

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Source brief mandates the platform must work fully with AI providers down.
**Decision:** The readiness score formula uses only `StudentSkill (CONFIRMED)` rows and `RoleRequirementSet` data. No AI call is in the synchronous scoring path. AI explanations arrive async as enhancements.
**Consequences:** Scoring Engine module MUST NOT import from AI Gateway. CI enforces this with dependency-cruiser rules.
**Source:** Document 1, Section 1 (Design Principle); Document 2, Section 4.5; Document 1, Section 6 (NFR)

---

### ADR-003: AI Gateway as the Sole LLM Access Point

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Provider abstraction is a hard requirement to allow swapping providers without code changes.
**Decision:** The AI Gateway module is the only module that imports any AI provider SDK. All other modules interact with it only via the `AIGatewayPort` interface.
**Consequences:** Adding a new AI provider = implementing one adapter. No domain logic changes. Architecture-boundary check (dependency-cruiser) enforces this in CI.
**Source:** Document 2, Section 7.1

---

### ADR-004: Human-in-the-Loop for AI Skill Suggestions

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** AI-extracted skills from resumes may contain errors; auto-merging would pollute the taxonomy and affect scores without student awareness.
**Decision:** AI-suggested skills are always created as `StudentSkill(status=PENDING_REVIEW, source=AI_SUGGESTED)`. Only student-confirmed skills become CONFIRMED and affect the readiness score.
**Consequences:** PENDING_REVIEW skills MUST be excluded from all score calculations. The confirmation UI is a required feature, not optional. This is also the primary mitigation against prompt injection (Document 3, Section 10).
**Source:** Document 1, FR-SKILL-03; Document 3, Section 10

---

### ADR-005: Append-Only RoleRequirementSet Versioning

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Changing role requirements in-place would invalidate the meaning of all historical ReadinessSnapshots.
**Decision:** Every update to role requirements creates a new RoleRequirementSet version. Historical snapshots reference the version active at calculation time and are never retroactively recalculated.
**Consequences:** Score history is immutable and meaningful. Admin UI must create new versions, not edit existing ones. `ReadinessSnapshot.breakdown` stores JSONB at calculation time for long-term interpretability.
**Source:** Document 2, Section 4.4

---

### ADR-006: RBAC Default-Deny with Mandatory Route Decorators

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Missing authorization on any route is a security vulnerability (OWASP A01).
**Decision:** Every NestJS route must have @Roles(...) or @Public(). A route with neither fails a lint/architecture check. Resource ownership (BOLA) is checked at the service layer.
**Consequences:** Every controller endpoint requires explicit authorization annotation. No "open by accident" routes. Permission matrix (Document 3, Section 2.3) is the source of truth for both decorators and integration tests.
**Source:** Document 3, Section 2.1

---

### ADR-007: Proficiency Scale — 5-Level Internal, 3-Band Display

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Source brief was ambiguous; stakeholder resolution required.
**Decision:** Proficiency stored as integer 1–5 in the database. Displayed as Beginner (1–2) / Intermediate (3) / Advanced (4–5) in the UI.
**Consequences:** Scoring engine uses 1–5 for finer granularity. All UIs map to 3-band labels. No raw integers exposed directly in student-facing text.
**Source:** Document 1, Section 11, Open Question #1

---

### ADR-008: Maximum 3 Target Roles Per Student (MVP)

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Source brief was silent on concurrency limits; dashboard design assumes multi-role comparison.
**Decision:** A student may have up to 3 concurrent active StudentTargetRole records.
**Consequences:** The 4th selection attempt returns a clear, actionable error. Dashboard is designed for 1–3 Readiness Rings side-by-side.
**Source:** Document 1, Section 11, Open Question #3

---

### ADR-009: Organization Entity Nullable from Day One

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Multi-tenant institutional features are post-MVP, but retrofitting the FK later is high-risk.
**Decision:** User and StudentProfile carry a nullable organizationId FK from day one. No Organization UI is built in MVP.
**Consequences:** Schema supports future multi-tenancy without migration. All MVP queries implicitly filter to `organizationId = null` behavior (no institutional scoping in MVP).
**Source:** Document 1, Section 3.3; Document 2, Section 4.1

---

### ADR-010: Color Token System — Custom, Not ShadCN Defaults

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Using ShadCN defaults out of the box produces a "college project template" look, per source brief.
**Decision:** All UI uses the custom color token system defined in Document 4, Section 3. ShadCN default slate/zinc palette is fully overridden. Aurora gradient is reserved exclusively for the Readiness Ring high-score arc, the onboarding hero empty state, and the login/register page wash.
**Consequences:** Any new component must use CSS variables (`--canvas`, `--accent`, etc.) not hardcoded hex values. Three-use-only aurora gradient is a standing architectural constraint.
**Source:** Document 4, Section 2 and Section 3

---

### ADR-011: Local Embedding Model — Not Groq for Normalization

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Normalization must work when Groq is down (AI Independence Law). Calling an LLM per keystroke is prohibitively expensive and slow.
**Decision:** A locally-hosted small embedding model (sentence-transformer via onnxruntime or similar) runs inside the worker process. Embeddings are computed without any external network call. This is explicitly NOT a Groq call.
**Consequences:** Worker process has a higher startup time (model load). Embedding dimensions must match the pgvector column definition exactly. Model upgrade = new migration for re-embedding all skills/roles.
**Source:** Document 2, Section 6.3 Step 3; Document 2, Section 14

---

### ADR-012: Readiness Score Formula — Exact Specification

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** The formula must be specified precisely enough that it produces identical output for identical inputs across all sessions.
**Decision:** `weight(REQUIRED)=3, weight(IMPORTANT)=2, weight(NICE_TO_HAVE)=1` (configurable via PlatformConfig). `achieved(r) = min(studentProficiency, targetProficiency) / targetProficiency`. `ReadinessScore = 100 * Σcontribution / ΣmaxContribution`.
**Consequences:** Weights are not hardcoded — they come from PlatformConfig. Changing weights affects all future calculations but NOT historical snapshots. A role with zero requirements must return null/undefined score (not NaN or 0), with clear domain-level signal.
**Source:** Document 2, Section 4.5

---

### ADR-013: JSONB Breakdown in ReadinessSnapshot — Snapshot Stability

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** RoleRequirement rows may be modified in later versions, making the current state non-representative of historical scores.
**Decision:** `ReadinessSnapshot.breakdown` stores the full per-requirement detail (skillId, importance, targetProficiency, studentProficiency, classification) as JSONB at calculation time. The Gap Report Matrix renders from this JSONB, not from live RoleRequirement rows.
**Consequences:** Breakdown is never "wrong" even after requirement set updates. The `requirementSetId` FK provides auditability of which version was used.
**Source:** Document 2, Section 4.4 and Section 12

---

### ADR-014: Refresh Token — Opaque, Hashed, httpOnly Only

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Refresh tokens are long-lived (7 days) and represent significant risk if leaked.
**Decision:** Refresh tokens are 256-bit CSPRNG opaque strings. Only SHA-256 hash stored. Raw value in httpOnly/Secure/SameSite=Strict cookie scoped to /api/auth/refresh ONLY. Never in JSON response body. familyId tracks rotation chain.
**Consequences:** Reuse detection is mandatory — a revoked token presented = entire family revoked + AuditLog HIGH severity entry. No refresh token logic outside the auth module.
**Source:** Document 3, Section 4.1 and 4.2

---

### ADR-015: File Upload Security — Magic Bytes, Not Extension/Content-Type

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** File extension spoofing is trivial; Content-Type is client-controlled.
**Decision:** All file type validation uses magic byte inspection (e.g., `file-type` library). Files stored with UUID storage keys (not original filenames). All files quarantined until antivirus scan clears them. Scan failure ≠ auto-approve.
**Consequences:** Original filename stored as metadata only. No file is parsed or made available until status = AVAILABLE. REJECTED files are immediately deleted from Cloudinary.
**Source:** Document 3, Section 7.1 and 7.2

---

### ADR-016: Idempotent Job Processing — Upsert Pattern

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Worker crashes mid-job must not produce duplicate rows or data corruption.
**Decision:** All BullMQ job processors use upsert (not create) keyed by entity ID + version/generation marker. Jobs are re-runnable without side effects.
**Consequences:** Processor logic must include an idempotency key design before implementation. No processor may use plain `create` for entities that a re-run would touch.
**Source:** Document 2, Section 7.2

---

### ADR-017: Soft Deletes for Users, Profiles, and Taxonomy Entities

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Hard deleting would orphan ReadinessSnapshot history; admin "deactivate" ≠ erasure.
**Decision:** User, StudentProfile, Skill, Role (and their derived entities) use `deletedAt` nullable timestamp for soft deletes. Hard deletion (GDPR/right-to-erasure) is a separate, explicit, audited operation that anonymizes ReadinessSnapshot/AuditLog rows rather than deleting them.
**Consequences:** All queries on these tables must filter `WHERE deletedAt IS NULL` by default. StudentSkill is a hard delete (its point-in-time data lives in ReadinessSnapshot.breakdown JSONB).
**Source:** Document 2, Section 12

---

### ADR-018: Four Mandatory Frontend States for Every Data-Fetching Component

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Document 4 mandates explicit loading, error, and empty states. "Just don't render" is not acceptable.
**Decision:** Every component that fetches data must implement: loading (skeleton, not spinner), error (with retry and context-appropriate message), empty (invitation to act), and populated states.
**Consequences:** No data-fetching component may be marked "done" until all four states are implemented and reviewed. Skeleton screens must mirror the target page's card layout structure.
**Source:** Document 4, Section 12–15

---

### ADR-019: No Optimistic Updates on Readiness Score

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** The readiness score is the platform's core trust-bearing number. A score that briefly shows an optimistic value then reverts would directly undermine user trust.
**Decision:** Optimistic updates are permitted for low-risk, high-frequency interactions (proficiency chips, roadmap status toggles). Never for ReadinessSnapshot-derived scores. The score always reflects the server-confirmed value.
**Consequences:** Score display may briefly show a stale value while recalculation is in flight (covered by the ring's "updating" pulse/glow animation per Document 4 §13). TanStack Query invalidation triggers a refetch; the new score replaces the old one atomically.
**Source:** Document 2, Section 8.2; Document 4, Section 11

---

### ADR-020: PlatformConfig as Runtime-Configurable Constants

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** Several formula constants (importance weights, similarity thresholds, rate limits) should be tunable post-launch without redeploy.
**Decision:** Importance weights (3/2/1), normalization thresholds (0.92/0.75), circuit-breaker thresholds, and AI provider selection per feature all live in PlatformConfig (a DB-backed config store). Changes take effect on next use, not redeploy.
**Consequences:** Every code path that uses these values must read from PlatformConfig at request time (with short-TTL cache acceptable). Hardcoding any of these values is a specification violation. Changes to scoring-relevant constants must be logged with their effective-date in AuditLog.
**Source:** Document 2, Section 4.5; Document 2, Section 6.3; Document 1, FR-ADMIN-07

---

### ADR-021: Conventional Commits Enforced at Commit-Msg Hook Level

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** CI changelog generation and semantic versioning require a consistent commit message format. A Husky `commit-msg` hook is the earliest possible enforcement point.
**Decision:** All commits must follow Conventional Commits format: `type(scope): subject` where type ∈ {feat, fix, chore, docs, style, refactor, test, ci, perf, build}. Enforced via `.husky/commit-msg` regex. Violations prevent the commit from completing.
**Consequences:** Contributors must learn the format. Bypassing with `--no-verify` is possible but tracked via CI which verifies PR history. Merge commits from GitHub (squash merge) are exempt by default.
**Source:** SGIP-1.1.1.2 implementation decision; enables future `standard-version` or `semantic-release` tooling.

---

### ADR-022: Three Separate Redis Connections Per Process (BullMQ Producer, BullMQ Consumer, App Cache/Health)

**Date:** 2026-06-15
**Status:** ACCEPTED
**Context:** @nestjs/bullmq requires dedicated Redis connections for its producer and consumer pools. Application-level caching and health checks require a third, independently manageable connection.
**Decision:** `RedisService` (injected from `RedisModule`) is a separate `ioredis` client used exclusively for health checks and application cache (`GET`/`SET`/`DEL`). BullMQ manages its own connections internally via `BullModule.forRootAsync`. These connections must never be shared or reused across roles.
**Consequences:** Three Redis connections per API process, two per worker process (no app cache in worker). This is expected and documented. `RedisService` uses `lazyConnect: true` to avoid startup failures when Redis is temporarily unavailable. Connection timeout is set to 2000ms for fast health-check fail.
**Source:** SGIP-1.1.3.1 / SGIP-1.1.3.2 implementation; ioredis and BullMQ best practices.
