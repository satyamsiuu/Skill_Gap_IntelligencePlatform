# Skill Gap Intelligence Platform (SGIP)

## Document 1 — Product Requirements Document (PRD)

**Version:** 0.1 (Founding Architecture Draft)
**Status:** Draft for engineering kickoff
**Owners:** Product, Engineering, Security, UX, Data

---

## 1. Product Vision

SGIP is an AI-assisted career intelligence operating system that continuously answers one question for a student: _"What is the gap between who I am today and the role I want, and what is the fastest credible path to close it?"_

The platform is not a resume builder, not a course marketplace, and not a generic LMS. It is a **decision-support and progress-tracking layer** that sits on top of a structured taxonomy of skills and roles, and produces:

1. A **readiness score** per student per target role, computed deterministically from a transparent rules engine.
2. A **skill-gap report** showing matched, partially-met, and missing skills, weighted by importance.
3. A **personalized roadmap** of what to learn next, in what order, with AI-generated explanations.
4. A **time-series view** of readiness, so progress is visible and motivating.

The defining design principle is **"deterministic core, AI-assisted edges."** Every number a student sees that affects their self-perception of employability (the readiness score) must be explainable, reproducible, and computable without any AI call. AI is layered on top to explain, recommend, extract, and normalize — never to decide.

This distinction is the single most important architectural commitment in this document, and it shapes the database design, the service boundaries, and the AI architecture described in Document 2.

---

## 2. Business Goals

| #   | Goal                                                                  | Why it matters                                                                                                                                        | How SGIP measures it                                                                                                             |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Give students a single, trustworthy readiness signal per target role  | Students currently rely on scattered advice, job descriptions, and anxiety. A single transparent score becomes the product's core habit-forming loop. | % of active students with a calculated readiness score for at least one role                                                     |
| G2  | Reduce time-to-clarity for "what should I learn next"                 | The roadmap is the monetizable and retention-driving feature.                                                                                         | Median time from signup to first roadmap generated                                                                               |
| G3  | Build a reusable, evolving skill & role taxonomy                      | This taxonomy is the platform's long-term moat — better data compounds.                                                                               | Growth rate of canonical skills/roles vs. duplicate candidates created                                                           |
| G4  | Enable institutions to monitor cohort-level readiness                 | This is the path to B2B revenue (placement cells, universities).                                                                                      | Admin adoption of cohort dashboards (post-MVP)                                                                                   |
| G5  | Keep the platform fully functional with AI providers degraded or down | AI vendor outages, rate limits, and cost spikes are a near-certainty with Groq as a sole initial provider.                                            | % of core flows (profile, skills, role selection, readiness, gap report) that pass automated tests with AI mocked as unavailable |

---

## 3. User Personas

### 3.1 Primary Persona — "Ananya," the Final-Year Student

- 21 years old, final year of a B.Tech/B.Sc program, moderate self-taught technical skill.
- Knows HTML/CSS/JS/React from personal projects and one internship; unsure if this is "enough" for a Full Stack Developer role.
- Anxious about placements, comparing herself to peers, easily overwhelmed by generic "100 things to learn" lists.
- Needs: a credible number, a short prioritized list, and visible progress over weeks/months.
- Will abandon the product if onboarding (profile + skills + resume) takes more than ~5 minutes or if the readiness score feels arbitrary/unexplained.

### 3.2 Secondary Persona — "Mr. Rao," the Placement Cell Coordinator (Admin)

- Manages 200–2,000 students across one or more departments.
- Needs to define which roles matter to his institution this year, ensure the role-requirement taxonomy reflects current industry expectations, and spot students who are "red" (low readiness) early enough to intervene.
- Low tolerance for messy data — duplicate roles, inconsistent skill names, or unmoderated AI-suggested taxonomy entries will erode trust quickly.
- Needs: bulk views, a normalization review queue, and audit trails (for accountability to his institution).

### 3.3 Tertiary / Future Persona — "Org Admin" (Institution-level Administrator)

- Not in MVP scope per the source brief, but the brief explicitly names "educational institutions" and "placement departments" as primary stakeholders and lists "future career-development ecosystems" as a goal.
- **Architectural implication (flagged for Document 2):** if we model `User` and `Role-of-platform (Admin/Student)` without any notion of an owning organization, retrofitting multi-tenant boundaries later (data isolation, cohort scoping, branded sub-portals) is a high-risk, high-cost migration. We recommend introducing a lightweight `Organization` entity in the MVP schema (nullable for individual users) even though no UI is built for it yet. This is detailed in Document 2, Section 4.

---

## 4. User Journeys

### 4.1 Student — First-Run Journey (Critical Path)

1. **Register** (email + password, or future SSO) → email verification.
2. **Create Profile** — name, education level, branch/program, graduation year, optional bio.
3. **Add Skills** — searchable autocomplete against canonical skill taxonomy; each skill gets a **self-reported proficiency level** (see Section 8, FR-SKILL-02 — this is a deliberate addition to the source brief).
4. **Upload Resume** (optional but encouraged) → async AI extraction proposes additional skills as "suggested, unconfirmed" → student reviews and accepts/rejects each suggestion (human-in-the-loop, never auto-merged).
5. **Select Target Role(s)** — search canonical roles; if no confident match, system creates a "role candidate" behind the scenes (see Section 9) while still letting the student proceed against the nearest canonical role for immediate feedback.
6. **Receive Skill Gap Analysis** — matched / partial / missing skills, each tagged with the role's importance weight (Required / Important / Nice-to-have).
7. **View Readiness Score** — a 0–100 score with a transparent breakdown ("Why this number?" expandable explanation, partly templated, partly AI-phrased).
8. **Receive Roadmap** — ordered list of skill gaps to close, each linked to suggested learning resources/projects (AI-assisted recommendations, human-curated fallback list).
9. **Track Progress** — readiness score recalculated whenever skills/proficiency change; historical snapshots shown as a trend line.

### 4.2 Student — Returning Journey

Login → Dashboard (readiness summary across all target roles, recent activity, roadmap progress) → drill into a specific role → update skills/proficiency or mark roadmap items complete → score recalculates → updated gap report.

### 4.3 Administrator Journey

Login → Admin Dashboard (platform health metrics, pending normalization review items, recent activity) → Manage Skills (CRUD canonical skills, merge duplicates, review AI-suggested skill candidates) → Manage Career Roles (CRUD canonical roles, review role candidates) → Manage Role Requirements (define which skills map to which roles, with importance weight and target proficiency level) → Manage Users (search, view profiles, deactivate, role assignment) → Monitor Platform Activity (audit log viewer, AI usage/cost dashboard, error rates).

---

## 5. Functional Requirements

Functional requirements are grouped by domain and tagged with an ID used for traceability into Document 5 (Feature Ticket List).

### 5.1 Identity & Profile

- **FR-AUTH-01**: Users can register with email + password. Passwords meet a defined complexity policy (Document 3).
- **FR-AUTH-02**: Email verification is required before a student can access core flows beyond profile creation (configurable per environment for dev/test).
- **FR-AUTH-03**: Login issues a short-lived access token (JWT) and a long-lived, rotating refresh token.
- **FR-AUTH-04**: Users can log out, which revokes the active refresh token.
- **FR-AUTH-05**: Password reset via emailed time-limited token.
- **FR-PROFILE-01**: Students can create/edit a profile: name, education details, program/branch, graduation year, location, bio, avatar.
- **FR-PROFILE-02**: Profile completeness is tracked and surfaced (drives onboarding nudges).

### 5.2 Skills Management

- **FR-SKILL-01**: Students can search and add skills from the canonical taxonomy via type-ahead.
- **FR-SKILL-02 (added beyond source brief)**: Each student-skill association carries a **proficiency level** (enum: Beginner / Intermediate / Advanced, or numeric 1–5). _Rationale:_ "possesses HTML" is binary and insufficient for a credible readiness score — a role requiring "Advanced React" is not satisfied by "Beginner React." Without this field, the entire scoring engine degrades to a checklist, which the source brief explicitly says is not the goal ("less like a CRUD application").
- **FR-SKILL-03**: Students can mark a skill as **self-reported** vs **AI-suggested-and-confirmed** vs **AI-suggested-pending-review**. Only confirmed skills contribute to the readiness score.
- **FR-SKILL-04**: Students can remove skills.
- **FR-SKILL-05**: If a student searches for a skill that does not exist in the taxonomy, they can submit a **skill candidate** (free-text), which enters the same normalization pipeline described in Section 9 (applied to skills, not just roles — see Document 2 for the generalized normalization service).

### 5.3 Document & Evidence Management

- **FR-DOC-01**: Students can upload a resume (PDF/DOCX, size-limited, virus-scanned — see Document 3).
- **FR-DOC-02**: Resume upload triggers an **asynchronous** AI parsing job. The UI must never block on this (source brief: AI must not be a dependency for basic functionality).
- **FR-DOC-03**: Students can upload certificates (PDF/image) and associate them with a specific skill, optionally with an issue date and issuing organization.
- **FR-DOC-04**: Students can upload project evidence (links — GitHub/portfolio URLs — and/or files) and tag projects with the skills demonstrated.
- **FR-DOC-05**: Certificates and tagged-skill projects increase a skill's "evidence strength," which is surfaced in the UI (e.g., a badge) but **does not, by itself, change the readiness score formula in MVP** — see Section 11 (Assumptions) for why this is deliberately deferred rather than silently built in.

### 5.4 Career Roles & Role Normalization

- **FR-ROLE-01**: Students can search canonical career roles and select one or more as **target roles**.
- **FR-ROLE-02**: If the search input doesn't match a canonical role with high confidence, the system runs it through the normalization pipeline (Section 9): either silently links to an existing role (high confidence), or creates a **role candidate** flagged for admin review (low/medium confidence), while immediately showing the student results against the closest existing canonical role so they are never blocked.
- **FR-ROLE-03**: Each canonical role has a versioned set of **role requirements** — skills with an importance weight (Required / Important / Nice-to-have) and a target proficiency level.
- **FR-ROLE-04**: Role requirement sets are versioned (Document 2, Section 4.4). Historical readiness scores reference the requirement-set version active at calculation time, so a student's past score doesn't silently change when an admin updates requirements.

### 5.5 Gap Analysis & Readiness Scoring

- **FR-SCORE-01**: For each (student, target role) pair, the system computes:
  - **Matched skills**: student proficiency ≥ required proficiency.
  - **Partial skills**: student has the skill but below required proficiency.
  - **Missing skills**: student does not have the skill at all.
- **FR-SCORE-02**: A weighted **readiness score (0–100)** is computed deterministically (formula in Document 2, Section 4.5) using requirement importance weights and proficiency gaps. This calculation runs entirely in the backend's domain service layer — **no AI call is in the critical path.**
- **FR-SCORE-03**: Readiness scores are recalculated on any of: skill added/removed, proficiency changed, role requirements updated (re-snapshotted against the version active at the time), target role added.
- **FR-SCORE-04**: Each readiness calculation is persisted as a historical snapshot (timestamp, score, requirement-set version, matched/partial/missing breakdown) to support the "track progress over time" requirement.
- **FR-SCORE-05**: An optional, asynchronous **AI explanation layer** translates the deterministic breakdown into natural-language guidance ("You're at 68% for Full Stack Developer — your core web fundamentals are strong, but Docker and SQL are your biggest blockers right now"). If AI is unavailable, a template-based explanation (string interpolation, no AI) is shown instead — never a blank state.

### 5.6 Roadmap & Recommendations

- **FR-ROADMAP-01**: For each target role, the system generates a prioritized roadmap of missing/partial skills, ordered by a deterministic priority score (importance weight × proficiency gap × a configurable "foundational-skill-first" heuristic — e.g., prerequisite ordering).
- **FR-ROADMAP-02**: Each roadmap item can be enriched with AI-suggested learning resources and project ideas. AI suggestions are cached and have a curated fallback (admin-managed default resource list per skill) for when AI is unavailable or rate-limited.
- **FR-ROADMAP-03**: Students can mark roadmap items as "in progress" / "completed," which feeds back into FR-SCORE-03 if completing an item implies a proficiency update (student must confirm the proficiency change explicitly — no silent auto-upgrades).

### 5.7 Administration

- **FR-ADMIN-01**: CRUD for canonical skills, including aliases/synonyms (for search and normalization).
- **FR-ADMIN-02**: CRUD for canonical roles, including aliases/synonyms.
- **FR-ADMIN-03**: CRUD for role requirements (skill, importance weight, target proficiency) with versioning — new versions are created rather than mutating history.
- **FR-ADMIN-04**: **Normalization review queue** — list of pending skill/role candidates with their proposed match (and confidence score), allowing admins to: approve as new canonical entry, merge into an existing entry (with alias creation), or reject.
- **FR-ADMIN-05**: User management — search, view, deactivate/reactivate, role assignment (Student/Admin), view audit history for a user.
- **FR-ADMIN-06**: Platform activity monitoring — audit log viewer with filters; AI usage dashboard (calls, latency, cost estimate, error rate, by provider); system health indicators.
- **FR-ADMIN-07**: Platform configuration — feature flags (e.g., enable/disable AI features independently), AI provider selection/fallback order, scoring formula constants (with change history, since these affect FR-SCORE-02 outputs going forward — not retroactively).

---

## 6. Non-Functional Requirements

| Category                 | Requirement                                                                                                                                                                                   | Notes / Justification                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Availability**         | Core student flows (auth, profile, skills CRUD, role selection, readiness score, gap report) must remain fully functional with 100% of AI providers down.                                     | Direct mandate from source brief; drives the AI abstraction boundary in Document 2. |
| **Performance**          | Readiness score recalculation for a single (student, role) pair completes in <200ms server-side (no AI in path).                                                                              | Enables real-time UI feedback when a student edits a skill.                         |
| **Performance**          | AI-backed operations (resume parsing, roadmap enrichment) are asynchronous, with job status polling or websocket/SSE push; UI never blocks a primary action on an AI call.                    |                                                                                     |
| **Scalability**          | Skill and role tables designed to scale to 10,000+ skills and 1,000+ roles without query degradation (proper indexing, normalized many-to-many tables, full-text/trigram search).             | Source brief explicitly states "thousands of skills."                               |
| **Data Integrity**       | All score-affecting writes (skills, proficiency, role requirements) occur within transactional boundaries; AI never writes directly to scoring-relevant tables (Document 2, AI architecture). |                                                                                     |
| **Security**             | OWASP ASATG/Top 10 aligned; full detail in Document 3.                                                                                                                                        |                                                                                     |
| **Accessibility**        | WCAG 2.1 AA minimum across student-facing UI.                                                                                                                                                 | Source brief: "Accessibility-first design."                                         |
| **Internationalization** | Not in MVP scope, but all user-facing strings must be externalized (i18n-ready) to avoid a costly retrofit.                                                                                   | Recommended addition given "future career-development ecosystems" language.         |
| **Observability**        | Structured logging, request tracing (correlation IDs), and AI-call-specific telemetry (latency, token usage, cost) from day one.                                                              | Required to make FR-ADMIN-06 meaningful and to debug AI-degraded states.            |
| **Maintainability**      | AI provider abstraction must allow adding a new provider via configuration + adapter implementation, with zero changes to domain services.                                                    | Source brief mandate.                                                               |
| **Data Retention**       | Resumes/certificates retained per a configurable policy; deletion on account deletion cascades to storage provider (Cloudinary), not just the database row.                                   | Privacy requirement, detailed in Document 3.                                        |

---

## 7. Success Metrics

| Metric                             | Definition                                                                                          | Why it's the right metric (and what we rejected)                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Activation Rate**                | % of registered students who reach a calculated readiness score within 24h of signup                | Proxy for "did the core value loop work." We rejected raw signups as a vanity metric.                                                            |
| **Roadmap Engagement**             | % of students with ≥1 roadmap item marked in-progress within 7 days                                 | Validates that the roadmap is actionable, not just informational.                                                                                |
| **Readiness Improvement Velocity** | Median Δ readiness score per active student over 30 days                                            | Direct evidence of the platform's stated purpose ("how readiness changes over time").                                                            |
| **Taxonomy Health**                | Ratio of normalization-pipeline auto-links (high confidence) to admin-reviewed candidates over time | A _rising_ ratio indicates the taxonomy is converging (fewer genuinely new roles/skills appearing) — a leading indicator of long-term moat (G3). |
| **AI Degradation Resilience**      | % of synthetic "AI outage" test runs in which core flows (Section 6, Availability) pass             | Operationalizes the AI-independence NFR; should be tracked in CI, not just prod.                                                                 |
| **Admin Review Latency**           | Median time from candidate creation to admin decision in the normalization queue                    | A growing backlog here directly degrades student experience (role searches resolve to mismatched roles longer) and is an early warning metric.   |

---

## 8. Assumptions

1. **Proficiency levels are self-reported in MVP.** We assume students will self-report proficiency honestly enough for the score to be _directionally_ useful, while acknowledging it is not a certification. This is communicated in the UI ("self-assessed") and is a deliberate scope boundary — building a skill-assessment/testing engine is a separate, larger product and is explicitly out of MVP scope.
2. **"Evidence strength" (certificates, projects) is tracked but does not yet feed the score formula.** We assume that conflating "I claim Advanced React" with "I have a certificate that says Advanced React" into a single number in v1 would create a false sense of rigor before we've validated the simpler model. Evidence-weighted scoring is a clearly-flagged Phase 2+ roadmap item (Section 10).
3. **A single role-requirement set per canonical role** (versioned) is sufficient for MVP — i.e., "Full Stack Developer" has one definition, not institution-specific variants. Institution-specific requirement overrides are a future-roadmap item tied to the `Organization` entity (Section 3.3).
4. **Groq's free/initial tier is rate-limited and occasionally unreliable** — we assume this as a near-certainty, not a risk, and design the AI abstraction layer and async job architecture around it from day one rather than retrofitting resilience later.
5. **Resume parsing accuracy will be imperfect.** We assume AI-extracted skills are _suggestions requiring confirmation_, never auto-applied — this is both a UX decision and a data-integrity safeguard against the normalization taxonomy being polluted by hallucinated skill names.
6. **English-only content in MVP**, but all strings externalized for future i18n (Section 6).

---

## 9. Constraints

1. **Stack constraints are fixed** (Next.js/TypeScript/Tailwind/ShadCN/TanStack Query frontend; NestJS/TypeScript backend; PostgreSQL + Prisma; JWT + refresh tokens; Cloudinary-equivalent storage) per source brief. Document 2 builds within these constraints but flags where a constraint creates friction (notably: Prisma's handling of versioned/temporal data and full-text/fuzzy search, addressed via raw SQL escape hatches and `pgvector`/`pg_trgm` extensions).
2. **AI provider constraint**: Groq as initial provider, but the abstraction layer is a hard architectural requirement, not a "nice to have" — it is treated as a first-class service boundary (Document 2, AI Architecture).
3. **No code is to be produced in this documentation phase** — all decisions here must be specific enough that implementation can begin without further architectural discovery, but deliverables are documentation artifacts only.
4. **Dark-mode-first, premium SaaS visual direction is fixed** per source brief (Document 4 elaborates the design system).

---

## 10. Future Roadmap (Post-MVP)

| Phase  | Theme                          | Representative Capabilities                                                                                                                                                            |
| ------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** | Evidence-weighted scoring      | Certificates/projects contribute a verified bonus to the readiness score; "verification" workflow (e.g., admin or peer attestation, or integration with credential-verification APIs). |
| **R2** | Multi-tenant institution layer | Activate the `Organization` entity: institution-branded portals, cohort dashboards, institution-specific role requirement overrides, bulk student onboarding (CSV import).             |
| **R3** | Skill assessments              | Optional short assessments (quizzes/coding challenges) to convert self-reported proficiency into measured proficiency for specific high-leverage skills.                               |
| **R4** | Employer-side integration      | Allow employers/recruiters to define role requirement sets directly, and (opt-in) discover students above a readiness threshold — careful privacy design required (Document 3).        |
| **R5** | Additional AI providers        | Add OpenAI/Anthropic/Gemini/self-hosted adapters; introduce per-feature provider routing (e.g., cheaper model for skill extraction, stronger model for roadmap explanations).          |
| **R6** | Internationalization           | Activate i18n scaffolding built in MVP; localize taxonomy (skill/role name translations as aliases).                                                                                   |

---

## 11. Open Questions for Stakeholder Sign-off

These are points where the source brief is silent or underspecified, and a decision is needed before Document 5 tickets can be finalized. Recommended defaults are stated; engineering will proceed with these defaults unless overridden.

1. **Proficiency scale**: 3-level (Beginner/Intermediate/Advanced) vs. 5-level numeric. _Recommendation: 5-level numeric (1–5) internally, displayed as 3 labeled bands in the UI_ — gives the scoring engine finer granularity without overwhelming students.
2. **Email verification enforcement**: blocking vs. soft-nudge. _Recommendation: blocking for resume upload and role selection (data-sensitive actions), soft for browsing._
3. **Multiple target roles per student**: how many concurrently? _Recommendation: up to 3 in MVP (UI and dashboard are designed around comparing 2–3 roles side-by-side; unlimited roles would clutter the dashboard described in Document 4)._
4. **Role candidate visibility**: should a student see "your role is pending review" vs. silently see results against the nearest canonical role? _Recommendation: show both — "Showing results for **Software Engineer** (closest match). We've also logged 'AI Solutions Engineer' for review."_ — this is a transparency/trust decision consistent with the "premium, trustworthy" brand direction.
