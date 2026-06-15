# SGIP — Project Progress Tracker

**Last Updated:** 2026-06-15T21:34:00+05:30
**Current Phase:** Phase 3 — Student Management
**Current Epic:** SGIP-3.1 — Student Profile
**Overall Completion:** 36 / 89 stories complete

---

## Phase Completion Status

| Phase | Name                     | Status       | Stories Done / Total | Notes                                                 |
| ----- | ------------------------ | ------------ | -------------------- | ----------------------------------------------------- |
| 1     | Foundation               | ✅ COMPLETED | 21 / 21              | All tickets complete                                  |
| 2     | Identity & Access        | ✅ COMPLETED | 15 / 15              | All tickets complete — Phase 2 halted as requested    |
| 3     | Profile & Student Data   | NOT STARTED  | 0 / 10               | Depends on Phase 2                                    |
| 4     | Skills Management        | NOT STARTED  | 0 / 8                | Depends on Phase 1 DB; parallel with Phase 3 possible |
| 5     | Career Roles             | NOT STARTED  | 0 / 8                | Depends on Phase 4 (embeddings)                       |
| 6     | Gap Analysis Engine      | NOT STARTED  | 0 / 15               | Depends on Phases 4+5; MOST CRITICAL PHASE            |
| 7     | AI Gateway & AI Features | NOT STARTED  | 0 / 13               | Depends on Phase 6; AI Independence Law enforced here |
| 8     | Admin & Operations       | NOT STARTED  | 0 / 8                | Depends on Phases 6+7                                 |

---

## Ticket Status Registry

### Phase 1 — Foundation

#### SGIP-1.1 — Project & Infrastructure Setup

| Ticket ID    | Name                                       | Status       | Blockers | Completed At |
| ------------ | ------------------------------------------ | ------------ | -------- | ------------ |
| SGIP-1.1.1.1 | Initialize monorepo structure              | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.1.1.2 | Configure linting, formatting, pre-commit  | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.1.1.3 | Configure CI pipeline                      | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.1.2.1 | Provision PostgreSQL extensions            | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.1.2.2 | Initialize Prisma schema + base migration  | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.1.2.3 | Seed data scripts for taxonomy             | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.1.3.1 | Configure Redis connection + health checks | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.1.3.2 | Set up BullMQ + worker entrypoint          | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.1.3.3 | Configure environment/secrets management   | ✅ COMPLETED | None     | 2026-06-15   |

#### SGIP-1.2 — Architecture Scaffolding

| Ticket ID    | Name                                              | Status       | Blockers | Completed At |
| ------------ | ------------------------------------------------- | ------------ | -------- | ------------ |
| SGIP-1.2.1.1 | Create NestJS module skeletons                    | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.2.1.2 | Global ValidationPipe + exception filters         | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.2.1.3 | Architecture-boundary lint (dependency-cruiser)   | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.2.2.1 | Initialize Next.js App Router + Tailwind + ShadCN | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.2.2.2 | Implement Document 4 design tokens                | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.2.2.3 | TanStack Query provider + typed API client        | ✅ COMPLETED | None     | 2026-06-15   |

#### SGIP-1.3 — Observability & DevOps Baseline

| Ticket ID    | Name                                      | Status       | Blockers | Completed At |
| ------------ | ----------------------------------------- | ------------ | -------- | ------------ |
| SGIP-1.3.1.1 | Structured JSON logging + correlation IDs | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.3.1.2 | OpenTelemetry instrumentation baseline    | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.3.2.1 | Containerize API + worker (Dockerfiles)   | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.3.2.2 | IaC baseline (Postgres, Redis, compute)   | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-1.3.2.3 | CI/CD deploy gates (staging + production) | ✅ COMPLETED | None     | 2026-06-15   |

---

### Phase 2 — Authentication

#### SGIP-2.1 — Identity & Access

| Ticket ID    | Name                                             | Status       | Blockers | Completed At |
| ------------ | ------------------------------------------------ | ------------ | -------- | ------------ |
| SGIP-2.1.1.1 | User registration endpoint                       | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.1.2 | Email verification token issuance & consumption  | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.1.3 | Registration & verification UI                   | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.2.1 | Login endpoint (Argon2id)                        | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.2.2 | JWT access token issuance (RS256)                | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.2.3 | Refresh token rotation + reuse detection         | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.2.4 | Login UI + httpOnly cookie + CSRF                | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.2.5 | Logout + log out all devices                     | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.3.1 | Password reset request + emailed token           | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.3.2 | Password reset confirmation + session revocation | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.3.3 | Breached-password check integration              | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.4.1 | JwtAuthGuard + RolesGuard + @Public()/@Roles()   | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.4.2 | tokenVersion invalidation mechanism              | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.4.3 | Permission matrix integration test suite         | ✅ COMPLETED | None     | 2026-06-15   |
| SGIP-2.1.4.4 | Active sessions list UI                          | ✅ COMPLETED | None     | 2026-06-15   |

---

### Phase 3 — Student Management

| Ticket ID    | Name                                                 | Status      | Blockers     | Completed At |
| ------------ | ---------------------------------------------------- | ----------- | ------------ | ------------ |
| SGIP-3.1.1.1 | StudentProfile create/view/edit API                  | NOT STARTED | SGIP-2.1.4.3 | —            |
| SGIP-3.1.1.2 | Profile UI + avatar upload                           | NOT STARTED | SGIP-3.1.1.1 | —            |
| SGIP-3.1.1.3 | Profile completeness tracking                        | NOT STARTED | SGIP-3.1.1.1 | —            |
| SGIP-3.1.2.1 | Multi-step onboarding wizard UI                      | NOT STARTED | SGIP-3.1.1.2 | —            |
| SGIP-3.1.2.2 | Onboarding progress persistence                      | NOT STARTED | SGIP-3.1.2.1 | —            |
| SGIP-3.2.1.1 | StoragePort abstraction + Cloudinary adapter         | NOT STARTED | SGIP-1.1.3.1 | —            |
| SGIP-3.2.1.2 | Upload endpoint (magic-byte, size limits, UUID keys) | NOT STARTED | SGIP-3.2.1.1 | —            |
| SGIP-3.2.1.3 | Virus scan integration + quarantine lifecycle        | NOT STARTED | SGIP-3.2.1.2 | —            |
| SGIP-3.2.2.1 | Resume upload UI + async status indicator            | NOT STARTED | SGIP-3.2.1.3 | —            |
| SGIP-3.2.2.2 | Resume list/delete API + UI                          | NOT STARTED | SGIP-3.2.2.1 | —            |
| SGIP-3.2.3.1 | Certificate upload + skill-tagging                   | NOT STARTED | SGIP-3.2.1.2 | —            |
| SGIP-3.2.3.2 | Project evidence upload + skill-tagging              | NOT STARTED | SGIP-3.2.1.2 | —            |

---

### Phase 4 — Skills Management

| Ticket ID    | Name                                           | Status      | Blockers     | Completed At |
| ------------ | ---------------------------------------------- | ----------- | ------------ | ------------ |
| SGIP-4.1.1.1 | Skill/SkillAlias schema + initial seed dataset | NOT STARTED | SGIP-1.1.2.3 | —            |
| SGIP-4.1.1.2 | Skill search/autocomplete API (pg_trgm)        | NOT STARTED | SGIP-4.1.1.1 | —            |
| SGIP-4.1.2.1 | Local embedding model integration              | NOT STARTED | SGIP-1.1.3.2 | —            |
| SGIP-4.1.2.2 | pgvector setup + cosine similarity search      | NOT STARTED | SGIP-4.1.2.1 | —            |
| SGIP-4.2.1.1 | Add/remove StudentSkill API                    | NOT STARTED | SGIP-4.1.1.2 | —            |
| SGIP-4.2.1.2 | Proficiency update API (1–5 scale)             | NOT STARTED | SGIP-4.2.1.1 | —            |
| SGIP-4.2.1.3 | Student Skills UI (Skill Proficiency Chip)     | NOT STARTED | SGIP-4.2.1.2 | —            |
| SGIP-4.2.2.1 | Skill candidate creation on search-miss        | NOT STARTED | SGIP-4.2.1.1 | —            |

---

### Phase 5 — Career Roles

| Ticket ID    | Name                                         | Status      | Blockers     | Completed At |
| ------------ | -------------------------------------------- | ----------- | ------------ | ------------ |
| SGIP-5.1.1.1 | Role/RoleAlias schema + initial seed dataset | NOT STARTED | SGIP-4.1.2.1 | —            |
| SGIP-5.1.1.2 | Role search/autocomplete API                 | NOT STARTED | SGIP-5.1.1.1 | —            |
| SGIP-5.1.2.1 | RoleRequirementSet/RoleRequirement schema    | NOT STARTED | SGIP-5.1.1.1 | —            |
| SGIP-5.1.2.2 | Requirement-set versioning logic             | NOT STARTED | SGIP-5.1.2.1 | —            |
| SGIP-5.1.2.3 | Admin requirement-set editor API             | NOT STARTED | SGIP-5.1.2.2 | —            |
| SGIP-5.2.1.1 | Select/deselect target role API (max-3)      | NOT STARTED | SGIP-5.1.1.2 | —            |
| SGIP-5.2.1.2 | Role candidate creation on search-miss       | NOT STARTED | SGIP-5.2.1.1 | —            |
| SGIP-5.2.1.3 | Target role selection UI (role cards)        | NOT STARTED | SGIP-5.2.1.1 | —            |

---

### Phase 6 — Gap Analysis Engine

| Ticket ID      | Name                                                    | Status      | Blockers       | Completed At |
| -------------- | ------------------------------------------------------- | ----------- | -------------- | ------------ |
| SGIP-6.1.1.1   | Exact/alias match fast path                             | NOT STARTED | SGIP-4.1.1.1   | —            |
| SGIP-6.1.1.2   | Embedding similarity + confidence routing               | NOT STARTED | SGIP-6.1.1.1   | —            |
| SGIP-6.1.1.2.1 | Similarity-search integration into normalize()          | NOT STARTED | SGIP-6.1.1.1   | —            |
| SGIP-6.1.1.2.2 | Confidence-threshold routing logic                      | NOT STARTED | SGIP-6.1.1.2.1 | —            |
| SGIP-6.1.1.2.3 | Provisional-link re-pointing on admin resolution        | NOT STARTED | SGIP-6.1.1.2.2 | —            |
| SGIP-6.1.1.3   | NormalizationReviewItem queue creation                  | NOT STARTED | SGIP-6.1.1.2.2 | —            |
| SGIP-6.1.1.4   | PlatformConfig-driven similarity thresholds             | NOT STARTED | SGIP-1.1.2.2   | —            |
| SGIP-6.2.1.1   | Scoring formula domain service                          | NOT STARTED | SGIP-5.1.2.1   | —            |
| SGIP-6.2.1.1.1 | Per-requirement contribution/achieved calculation       | NOT STARTED | SGIP-5.1.2.1   | —            |
| SGIP-6.2.1.1.2 | Aggregate score + MATCHED/PARTIAL/MISSING               | NOT STARTED | SGIP-6.2.1.1.1 | —            |
| SGIP-6.2.1.1.3 | Unit test suite for formula edge cases                  | NOT STARTED | SGIP-6.2.1.1.2 | —            |
| SGIP-6.2.1.2   | ReadinessSnapshot persistence (JSONB breakdown)         | NOT STARTED | SGIP-6.2.1.1   | —            |
| SGIP-6.2.1.3   | Recalculation triggers (skill/role/requirement changes) | NOT STARTED | SGIP-6.2.1.2   | —            |
| SGIP-6.2.1.4   | Bulk recalculation background job                       | NOT STARTED | SGIP-6.2.1.3   | —            |
| SGIP-6.2.2.1   | Gap Report API                                          | NOT STARTED | SGIP-6.2.1.2   | —            |
| SGIP-6.2.2.2   | Gap Report Matrix UI component                          | NOT STARTED | SGIP-6.2.2.1   | —            |
| SGIP-6.3.1.1   | Deterministic roadmap priority-ordering algorithm       | NOT STARTED | SGIP-6.2.1.2   | —            |
| SGIP-6.3.1.2   | RoadmapItem persistence + status tracking               | NOT STARTED | SGIP-6.3.1.1   | —            |
| SGIP-6.3.1.3   | Roadmap Timeline UI + confirmation dialog               | NOT STARTED | SGIP-6.3.1.2   | —            |
| SGIP-6.3.2.1   | Readiness history API                                   | NOT STARTED | SGIP-6.2.1.2   | —            |
| SGIP-6.3.2.2   | Readiness trend chart UI (Recharts)                     | NOT STARTED | SGIP-6.3.2.1   | —            |

---

### Phase 7 — AI Gateway & AI Features

| Ticket ID    | Name                                                   | Status      | Blockers     | Completed At |
| ------------ | ------------------------------------------------------ | ----------- | ------------ | ------------ |
| SGIP-7.1.1.1 | AIProviderPort interface + GroqAdapter                 | NOT STARTED | SGIP-1.1.3.3 | —            |
| SGIP-7.1.1.2 | ProviderRouter + per-feature selection                 | NOT STARTED | SGIP-7.1.1.1 | —            |
| SGIP-7.1.1.3 | CircuitBreaker per provider                            | NOT STARTED | SGIP-7.1.1.2 | —            |
| SGIP-7.1.1.4 | Redis-backed ResponseCache                             | NOT STARTED | SGIP-7.1.1.2 | —            |
| SGIP-7.1.1.5 | AIUsageLog telemetry                                   | NOT STARTED | SGIP-7.1.1.1 | —            |
| SGIP-7.1.2.1 | BullMQ job processors (4 job types)                    | NOT STARTED | SGIP-7.1.1.2 | —            |
| SGIP-7.1.2.2 | Idempotent upsert patterns for job outputs             | NOT STARTED | SGIP-7.1.2.1 | —            |
| SGIP-7.2.1.1 | Text extraction from PDF/DOCX (non-AI)                 | NOT STARTED | SGIP-3.2.1.3 | —            |
| SGIP-7.2.1.2 | AI skill-extraction prompt + schema validation         | NOT STARTED | SGIP-7.2.1.1 | —            |
| SGIP-7.2.1.3 | PENDING_REVIEW StudentSkill creation + confirmation UI | NOT STARTED | SGIP-7.2.1.2 | —            |
| SGIP-7.2.2.1 | AI explanation prompt + template fallback              | NOT STARTED | SGIP-6.2.1.2 | —            |
| SGIP-7.2.2.2 | "AI Insight" UI treatment                              | NOT STARTED | SGIP-7.2.2.1 | —            |
| SGIP-7.2.3.1 | AI resource-suggestion + curated fallback              | NOT STARTED | SGIP-6.3.1.2 | —            |
| SGIP-7.2.3.2 | Admin default-resource management UI                   | NOT STARTED | SGIP-7.2.3.1 | —            |
| SGIP-7.2.4.1 | AI disambiguation-note generation                      | NOT STARTED | SGIP-6.1.1.3 | —            |

---

### Phase 8 — Admin & Operations

| Ticket ID    | Name                                              | Status      | Blockers     | Completed At |
| ------------ | ------------------------------------------------- | ----------- | ------------ | ------------ |
| SGIP-8.1.1.x | Taxonomy management CRUD (skills/roles)           | NOT STARTED | SGIP-7.1     | —            |
| SGIP-8.1.2.x | Normalization review queue UI                     | NOT STARTED | SGIP-6.1     | —            |
| SGIP-8.2.1.x | User management (search, deactivate, role assign) | NOT STARTED | SGIP-2.1     | —            |
| SGIP-8.2.2.x | Audit log viewer                                  | NOT STARTED | SGIP-2.1     | —            |
| SGIP-8.2.3.x | Platform configuration + feature flags            | NOT STARTED | SGIP-6.1.1.4 | —            |
| SGIP-8.2.4.x | AI usage + cost dashboard                         | NOT STARTED | SGIP-7.1.1.5 | —            |
| SGIP-8.3.x   | Admin dashboard (platform health KPIs)            | NOT STARTED | SGIP-8.2     | —            |

---

## Architectural Decisions Log (Quick Reference)

_See ARCHITECTURE_DECISIONS.md for full detail_

- **AI Independence Law**: Scoring Engine MUST NOT import AI Gateway. Enforced via dependency-cruiser in CI.
- **Human-in-the-Loop Law**: All AI-suggested skills = `PENDING_REVIEW`. Never auto-confirmed.
- **Versioned Requirements Law**: `RoleRequirementSet` is append-only. New versions only, never mutate.
- **Auth Law**: Every route requires `@Roles()` or `@Public()`. Routes with neither fail lint.
- **AI Gateway Singleton Law**: Only the AI Gateway module may reference any LLM provider SDK.
- **Deterministic Scoring Law**: Score formula uses only `StudentSkill(status=CONFIRMED)` + `RoleRequirementSet`. No AI in path. Must complete < 200ms.
- **Proficiency Scale**: 1–5 stored internally, displayed as Beginner/Intermediate/Advanced in UI.
- **Max Target Roles**: 3 concurrent active roles per student (MVP).
- **Organization FK**: Nullable from day one on User + StudentProfile (future multi-tenant readiness).
- **Aurora Gradient**: Reserved for (1) Readiness Ring ≥75 arc, (2) onboarding hero empty state, (3) login/register wash — nowhere else.
