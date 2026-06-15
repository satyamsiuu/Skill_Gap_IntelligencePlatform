# SGIP — Implementation Strategy Document

**Created:** 2026-06-15T16:05:45+05:30
**Author:** Senior Software Architect / Engineering Manager / Tech Lead / Project Manager
**Status:** APPROVED FOR EXECUTION

---

## 1. Executive Summary

This document translates all five foundational specification documents into a sequenced, dependency-resolved, risk-flagged implementation strategy. The critical discipline throughout: **read the spec before every ticket, update all five tracking files after every ticket, and never violate the seven Non-Negotiable Architectural Laws.**

The build order follows the phases defined in Document 5 exactly:
**Foundation → Identity & Access → Student Data → Skills → Roles → Gap Analysis Engine → AI Gateway & Features → Admin & Operations**

This is not arbitrary — each phase's output is a _prerequisite_ for the next phase's inputs. The dependency graph below makes this concrete.

---

## 2. Dependency Graph — Critical Path

```
SGIP-1.1.1.1 (Monorepo init)
    ├─→ SGIP-1.1.1.2 (Linting)
    │       └─→ SGIP-1.1.1.3 (CI pipeline)
    ├─→ SGIP-1.1.2.1 (PostgreSQL extensions)
    │       └─→ SGIP-1.1.2.2 (Prisma schema) ──────────────────────────────────────────┐
    │               └─→ SGIP-1.1.2.3 (Seed data)                                        │
    ├─→ SGIP-1.1.3.1 (Redis)                                                             │
    │       └─→ SGIP-1.1.3.2 (BullMQ + worker)                                          │
    │       └─→ SGIP-1.1.3.3 (Secrets management)                                       │
    └─→ SGIP-1.2.2.1 (Next.js init)                                                     │
            └─→ SGIP-1.2.2.2 (Design tokens)                                            │
            └─→ SGIP-1.2.2.3 (TanStack Query)                                           │
                                                                                         │
SGIP-1.1.2.2 (Prisma schema) ◄──────────────────────────────────────────────────────────┘
    └─→ SGIP-1.2.1.1 (NestJS module skeletons)
            └─→ SGIP-1.2.1.2 (Global ValidationPipe)
            │       └─→ SGIP-2.1.1.1 (Registration endpoint)
            │               └─→ SGIP-2.1.1.2 (Email verification)
            │                       └─→ SGIP-2.1.2.1 (Login endpoint)
            │                               └─→ SGIP-2.1.2.2 (JWT issuance)
            │                                       └─→ SGIP-2.1.4.1 (JwtAuthGuard + RolesGuard)
            │                                               └─→ SGIP-2.1.4.3 (Permission matrix tests)
            │                                                       └─→ SGIP-3.1.1.1 (StudentProfile API)
            │                                                               └─→ [Phase 4, 5, 6...]
            └─→ SGIP-1.2.1.3 (dependency-cruiser rules)

CRITICAL PATH (minimum viable scoring loop):
SGIP-1.1.1.1 → SGIP-1.1.2.1 → SGIP-1.1.2.2 → SGIP-1.2.1.1 → SGIP-2.1.1.1 → SGIP-2.1.2.2 →
SGIP-2.1.4.1 → SGIP-3.1.1.1 → SGIP-4.1.1.1 → SGIP-4.1.2.1 → SGIP-4.2.1.1 → SGIP-5.1.1.1 →
SGIP-5.1.2.1 → SGIP-5.2.1.1 → SGIP-6.2.1.1 → SGIP-6.2.1.2 → SGIP-6.2.1.3 → [MVP SCORING LIVE]
```

**Total critical path length:** ~22 tickets before the core scoring loop is operational.

---

## 3. Phase Sequencing — Rationale

| #   | Phase               | Why This Order                                                                                                        |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Foundation          | Everything else depends on the monorepo, DB schema, Redis, CI, and module skeletons existing                          |
| 2   | Identity & Access   | Auth guards are required by ALL Phase 3+ endpoints — they're a prerequisite, not optional                             |
| 3   | Student Data        | Profile + file upload must exist before skills/roles can be meaningfully associated to a student                      |
| 4   | Skills Management   | Canonical skill search + embedding infrastructure is required by the Normalization Engine (Phase 6)                   |
| 5   | Career Roles        | Role taxonomy + versioned requirements are the "right side" of the scoring formula                                    |
| 6   | Gap Analysis Engine | The core product. Requires Phases 4+5 complete. The Normalization Engine (6.1) feeds Phase 4+5 candidate flows.       |
| 7   | AI Gateway          | Layered on top of the deterministic core. Circuit breaker + fallbacks require the deterministic core to fall back TO. |
| 8   | Admin & Operations  | Management tooling for the taxonomy and user base — meaningful only once there's data to manage.                      |

---

## 4. Parallel Work Opportunities

These tracks can proceed simultaneously (different engineers or sessions) once their shared dependencies are complete:

### Track A: Backend API (Phases 1-2 complete first)

- Skills taxonomy + embedding (SGIP-4.1.x) **concurrent with** Role taxonomy (SGIP-5.1.x) after Phase 3 backend lands
- Document upload pipeline (SGIP-3.2.x) **concurrent with** Profile CRUD (SGIP-3.1.x)
- Normalization Engine (SGIP-6.1.x) **concurrent with** Scoring Engine (SGIP-6.2.x) — they have distinct dependencies

### Track B: Frontend Components (can scaffold against mock data)

- Design token system (SGIP-1.2.2.2) — pure CSS, no backend dependency
- Readiness Ring SVG component — pure UI, can be built/tested with stub data before SGIP-6.2 lands
- Gap Report Matrix component — same as above
- Onboarding wizard shell (SGIP-3.1.2.1) — shell + navigation, stub the API calls
- Skill Proficiency Chip component — pure UI

### Track C: Infrastructure (parallel with all feature work)

- SGIP-1.3.x (Observability + Deployment) can proceed in parallel with Phase 2 feature work
- IaC (SGIP-1.3.2.2) can be authored while Phase 2 authentication is being implemented

### Track D: Test Suites

- Permission matrix test suite (SGIP-2.1.4.3) defines the test contract. Each subsequent phase extends it.
- Scoring formula test suite (SGIP-6.2.1.1.3) should be authored **before** the implementation is started — test-first for the most critical computation.

---

## 5. Pre-Implementation Checklist (Per Ticket)

Before writing any code for a ticket:

1. Re-read the ticket's full text in `05-Feature-Ticket-List.md`
2. Identify all spec cross-references (Doc 2 section, Doc 3 section, Doc 4 component spec)
3. Verify all listed dependencies are `COMPLETED` in `PROJECT_PROGRESS.md`
4. Write a 3–5 line Pre-Flight Plan in `IMPLEMENTATION_LOG.md`
5. For any NestJS module: scaffold in order — `entity types → repository → service → controller → DTOs → tests`
6. For any Next.js component: scaffold in order — `types → data-fetching hook → base → loading → error → empty → full`

---

## 6. Top 7 Risk Items (Flagged Before Build Start)

### RISK-01: pgvector IVFFlat Index Tuning [HIGH]

- **Risk:** IVFFlat `lists` parameter set for seed data size may silently degrade at scale. HNSW may be preferred.
- **Mitigation:** SGIP-4.1.2.2 must include a migration comment documenting the tuning requirement and the chosen initial value. Consider HNSW from the start (available in pgvector ≥0.5). KNOWN_ISSUES.md tracks this (ISSUE-001).
- **Owner:** SGIP-4.1.2.2

### RISK-02: BullMQ Job Idempotency [HIGH]

- **Risk:** Worker crashes mid-job leaving partial writes. Re-runs create duplicate rows, corrupt `StudentSkill` or `RoadmapItem` data.
- **Mitigation:** All processors use upsert keyed on `(entityId, generationId)`. SGIP-7.1.2.2 must include a "crash mid-job and re-run" test. ADR-016 documents the pattern.
- **Owner:** SGIP-7.1.2.2

### RISK-03: JWT Refresh Token Rotation Correctness [HIGH]

- **Risk:** Refresh token reuse detection is one of the most subtle security mechanisms in the system. A bug here means either: (a) tokens aren't properly revoked, creating replay vulnerability, or (b) legitimate refresh requests are incorrectly rejected, breaking sessions.
- **Mitigation:** SGIP-2.1.2.3 must include integration tests covering: normal rotation, reuse detection (revoked token presented), family revocation, `familyId` propagation. These tests should run against a real (test) DB, not mocked.
- **Owner:** SGIP-2.1.2.3

### RISK-04: Scoring Engine AI Independence [CRITICAL — Architectural Law]

- **Risk:** A developer adds an AI-enrichment step directly inside `calculateReadiness()`, violating the AI Independence Law. This is invisible until AI goes down in production.
- **Mitigation:** SGIP-1.2.1.3 (dependency-cruiser) adds a CI rule that fails if `scoring` module imports `ai-gateway`. This rule must be in place BEFORE the scoring module is implemented. Run it on every PR.
- **Owner:** SGIP-1.2.1.3 (done before SGIP-6.2)

### RISK-05: Embedding-Based Normalization Confidence Calibration [MEDIUM]

- **Risk:** The 0.92/0.75 thresholds may need calibration against the real taxonomy. Too high = too many candidates created. Too low = wrong auto-links (taxonomy pollution).
- **Mitigation:** These are stored in PlatformConfig (ADR-020), not hardcoded. SGIP-6.1.1.4 creates the config. After SGIP-6.1.1.2 is built, run a calibration exercise against the seed taxonomy (test known aliases at different cosine similarities) and adjust before shipping Phase 6.
- **Owner:** SGIP-6.1.1.2 + SGIP-6.1.1.4

### RISK-06: Prompt Injection via Resume Content [HIGH — Security]

- **Risk:** A maliciously crafted resume could instruct the LLM to return fake skill names that look legitimate, which a student might accidentally confirm.
- **Mitigation:** Primary control: PENDING_REVIEW status (ADR-004) — even a "successful" injection only creates review-pending suggestions. Secondary: prompt hardening (untrusted content delimiters in SGIP-7.2.1.2). Tertiary: schema validation of AI output (SGIP-7.2.1.2 rejects any non-conforming response). All three must be implemented — none is sufficient alone.
- **Owner:** SGIP-7.2.1.2, SGIP-7.2.1.3

### RISK-07: Formula Precision — Zero-Division and Edge Cases [HIGH — Product Correctness]

- **Risk:** A role with zero requirements produces `0 / 0` = NaN or Infinity in the formula. A student with proficiency > target could score > 100.
- **Mitigation:** SGIP-6.2.1.1.2 unit tests must include: (a) zero requirements role = null/undefined score with clear domain signal, (b) proficiency > target = capped at 1.0 via `min()` in the formula. The test suite from SGIP-6.2.1.1.3 is the "executable spec" — Product must sign off on it before Phase 6 ships.
- **Owner:** SGIP-6.2.1.1.1, SGIP-6.2.1.1.2, SGIP-6.2.1.1.3

---

## 7. Module Dependency Rules (dependency-cruiser)

These rules MUST be in the CI pipeline by SGIP-1.2.1.3:

```
FORBIDDEN:
- scoring → ai-gateway          [AI Independence Law]
- taxonomy → ai-gateway         [AI Independence Law for taxonomy]
- auth → scoring                [Auth must not depend on domain logic]
- scoring → profiles            [Scoring takes profileId as input, queries through repo only]

ALLOWED ONE-WAY ONLY:
- ai-gateway → scoring          [AI explains scores, not the reverse]
- normalization → taxonomy      [Normalization writes candidates, taxonomy is passive]
- scoring → taxonomy            [Scoring reads requirement sets from taxonomy module]
- profiles → skills             [Profiles reads student skills via skills module port]
- documents → ai-gateway        [Documents triggers AI parsing jobs]
```

---

## 8. Security Architecture Checkpoints (Per Phase)

| Phase | Security Gate                                                                                                    |
| ----- | ---------------------------------------------------------------------------------------------------------------- |
| 1     | dependency-cruiser rules in CI; no secrets in committed files                                                    |
| 2     | Argon2id password hashing; RS256 JWT; httpOnly refresh token; reuse detection; default-deny guards               |
| 3     | Magic-byte file validation; quarantine lifecycle; signed-URL access only; mass-assignment protection on all DTOs |
| 4     | Ownership checks on StudentSkill endpoints; rate limiting on search/candidate creation                           |
| 5     | Admin-only requirement-set endpoints; audit logging for all admin mutations                                      |
| 6     | PENDING_REVIEW exclusion from score (automated test); no AI in scoring path (dependency-cruiser CI check)        |
| 7     | Prompt injection mitigations; schema validation of all AI outputs; circuit breaker tested; AI-outage test suite  |
| 8     | Audit log covers all admin mutations; tokenVersion invalidation on role changes; bulk-operation monitoring       |

---

## 9. Quality Gates — Per Phase

Before marking a phase COMPLETE, ALL of the following must pass:

### All Phases

- [ ] All unit tests for services pass
- [ ] All controller integration tests pass (including 403 tests for every ❌ cell in Document 3 §2.3 permission matrix)
- [ ] dependency-cruiser architecture boundary tests pass
- [ ] No route exists without @Roles() or @Public()

### Phase 6 (Scoring Engine — Extra Gate)

- [ ] Scoring formula test suite signed off by Product (SGIP-6.2.1.1.3)
- [ ] Automated test: PENDING_REVIEW skills do NOT appear in readiness score calculation
- [ ] Automated test: AI outage simulation — core flows (profile, skills, role selection, readiness, gap report) all pass

### Phase 7 (AI Gateway — Extra Gate)

- [ ] Synthetic "AI outage" test suite passes for all AI-dependent features
- [ ] Circuit breaker opens and falls back correctly (automated test)
- [ ] AI-suggested skills confirmed to never auto-confirm (automated test)
- [ ] All AI outputs schema-validated before any state change

### Frontend (All Phases)

- [ ] Dark mode renders with all custom color tokens (no ShadCN defaults visible)
- [ ] Loading / Error / Empty states implemented for all data-fetching components
- [ ] All interactive elements have visible keyboard focus rings
- [ ] Readiness Ring includes correct aria-label
- [ ] Animations respect prefers-reduced-motion

---

## 10. Phase 1 Execution Plan — Ticket Sequence

This is the exact sequence to begin execution:

**Step 1: Infrastructure Foundation (do first, unlocks everything)**

```
SGIP-1.1.1.1 → SGIP-1.1.1.2 → SGIP-1.1.1.3
SGIP-1.1.2.1 → SGIP-1.1.2.2 → SGIP-1.1.2.3
SGIP-1.1.3.1 → SGIP-1.1.3.2 → SGIP-1.1.3.3
```

**Step 2: Architecture Scaffolding (enables all feature work)**

```
SGIP-1.2.1.1 → SGIP-1.2.1.2 → SGIP-1.2.1.3   [Backend module skeletons + guards + boundary rules]
SGIP-1.2.2.1 → SGIP-1.2.2.2 → SGIP-1.2.2.3   [Frontend shell + tokens + TanStack Query]
```

**Step 3: Observability (parallel with Step 2)**

```
SGIP-1.3.1.1 → SGIP-1.3.1.2
SGIP-1.3.2.1 → SGIP-1.3.2.2 → SGIP-1.3.2.3
```

**Starting now: SGIP-1.1.1.1**

---

## 11. Technology Stack Summary (Locked — No Changes Without ADR)

| Layer          | Technology                                                  | Notes                                                             |
| -------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| Frontend       | Next.js 14+ (App Router) + TypeScript                       | SSR + edge for static assets                                      |
| Frontend State | TanStack Query (server) + Zustand (UI flow)                 | No global client-side score state                                 |
| UI Components  | ShadCN UI + Tailwind CSS + custom token system              | Custom tokens override all ShadCN defaults                        |
| UI Fonts       | Geist Sans (display), Inter (body), Geist Mono (data)       | Critical typographic decision per ADR-010                         |
| Backend        | NestJS + TypeScript (modular monolith)                      | Port/adapter pattern per module                                   |
| ORM            | Prisma + PostgreSQL                                         | Raw SQL migrations for pgvector/pg_trgm                           |
| Database       | PostgreSQL + pgvector + pg_trgm + pgcrypto                  | Extensions required before any schema migration                   |
| Queue          | BullMQ + Redis                                              | 4 named queues: documents, normalization, roadmap, scoring        |
| Auth           | RS256 JWT (15min) + opaque refresh tokens (7-day, rotating) | httpOnly cookies for refresh tokens                               |
| Storage        | Cloudinary ("raw" resource type for PDF/DOCX)               | Signed URLs only; never public                                    |
| AI Provider    | Groq (initial) via AIGatewayPort abstraction                | No direct provider SDK imports outside ai-gateway module          |
| Embeddings     | Local sentence-transformer via onnxruntime                  | No external network call; runs in worker process                  |
| Monorepo       | npm/pnpm workspaces — apps/web, apps/api, packages/shared   |                                                                   |
| CI/CD          | GitHub Actions                                              | Lint → typecheck → unit → boundary → integration → build → deploy |
