# SGIP — Known Issues & Technical Debt

**Purpose:** Track every known bug, deficiency, deferred decision, or technical debt item. Nothing gets silently "left for later" — it is logged here.

---

## Issue Format

### [ISSUE-ID] — [Title]

**Severity:** CRITICAL | HIGH | MEDIUM | LOW | DEBT
**Introduced In:** [ticket ID where this was created or discovered]
**Description:** [What is wrong or incomplete]
**Impact:** [What breaks or degrades if this is not fixed]
**Resolution Path:** [How to fix it, or which future ticket addresses it]
**Status:** OPEN | IN PROGRESS | RESOLVED

---

## Active Issues

### ISSUE-001 — pgvector IVFFlat Index Requires Future Retuning

**Severity:** MEDIUM
**Introduced In:** Pre-implementation (flagged in Document 2, Section 12 and Section 15.4)
**Description:** pgvector's IVFFlat index requires a `lists` parameter tuned to the table size. The initial value set during SGIP-4.1.2.2 is appropriate for the seed data size (~hundreds of skills) but will silently degrade as the taxonomy grows past thousands of entries.
**Impact:** Similarity search latency increases silently as taxonomy grows. The IVFFlat index may become less accurate without retuning. Users may see normalization results degrade without any obvious error.
**Resolution Path:** Schedule a periodic operational task (e.g., quarterly review) to re-index with updated `lists` value as the taxonomy grows. Consider switching to HNSW index which requires less retuning. Flag in the migration comment created during SGIP-4.1.2.2.
**Status:** OPEN

---

### ISSUE-002 — Local Embedding Model Increases Worker Memory Footprint

**Severity:** LOW
**Introduced In:** Pre-implementation (flagged in Document 2, Section 6.3)
**Description:** A sentence-transformer model loaded into the worker process via onnxruntime adds ~500MB–1GB to worker memory requirements depending on model choice.
**Impact:** Higher hosting cost for the worker process. Potential OOM if memory limits are set too conservatively.
**Resolution Path:** Document the memory requirement in SGIP-4.1.2.1. Choose the smallest model that produces acceptable embedding quality (measure embedding quality on the seed taxonomy before committing). Set worker container memory limits explicitly with headroom.
**Status:** OPEN

---

### ISSUE-003 — Bulk Recalculation Fan-Out Risk on Requirement Set Updates

**Severity:** HIGH
**Introduced In:** Pre-implementation (flagged in Document 2, Section 15.2)
**Description:** When an admin publishes a new RoleRequirementSet version, all students targeting that role need score recalculation. At scale, this is a large fan-out job. If processed naively (all at once, synchronously), it will exhaust DB connection pool.
**Impact:** DB connection pool exhaustion causing cascading failures for all active API requests. Degraded platform availability during admin requirement-set updates.
**Resolution Path:** SGIP-6.2.1.4 addresses this with a chunked BullMQ background job. The job must use configurable batch sizes (e.g., 50 students per chunk). Implement rate limiting on the job queue to prevent burst-write to DB. Monitor queue depth during testing.
**Status:** OPEN — resolution in SGIP-6.2.1.4

---

### ISSUE-004 — Taxonomy Pollution via Normalization Candidate Spam (Threat T3)

**Severity:** HIGH
**Introduced In:** Pre-implementation (flagged in Document 3, Section 11, Threat T3)
**Description:** An adversarial user (or a buggy client) can flood the normalization review queue by repeatedly searching for nonsense strings that don't match existing skills/roles, generating hundreds of NormalizationReviewItem rows.
**Impact:** Admin review queue becomes unusable. Admins spend time bulk-rejecting garbage instead of reviewing legitimate candidates. Taxonomy health metric (G3 in PRD) degrades.
**Resolution Path:** Per-user rate limiting on skill/role search that creates candidates. Per-user candidate creation cap (configurable via PlatformConfig). Bulk-reject tooling in admin normalization queue UI (SGIP-8.1.2.x). These controls must be implemented during SGIP-4.2.2.1 / SGIP-5.2.1.2.
**Status:** OPEN — partial resolution in SGIP-4.2.2.1, SGIP-5.2.1.2, SGIP-8.1.2.x

---

### ISSUE-005 — Cloudinary "raw" Resource Type Required for PDF/DOCX

**Severity:** MEDIUM
**Introduced In:** Pre-implementation (flagged in Document 2, Section 11)
**Description:** Cloudinary's default resource type does not support PDF/DOCX correctly. The "raw" resource type must be explicitly configured when uploading non-image files. If not set, uploads will fail silently or return unexpected results.
**Impact:** Resume and certificate uploads fail. The core document upload pipeline (Phase 3) breaks.
**Resolution Path:** Document this explicitly in SGIP-3.2.1.1's StoragePort/Cloudinary adapter implementation. Test with an actual PDF upload before marking the ticket complete.
**Status:** OPEN — resolution in SGIP-3.2.1.1

---

### ISSUE-006 — AI Feature Completeness Without AI Provider

**Severity:** LOW (architectural requirement, not a bug)
**Introduced In:** Pre-implementation (Document 1, Section 6 NFR, G5)
**Description:** Every AI-powered feature (resume parsing, score explanation, roadmap enrichment, normalization disambiguation) must have a verified deterministic fallback that activates when the circuit breaker is open or when the AI provider is fully unavailable.
**Impact:** If fallbacks are not implemented correctly, the platform degrades to "broken" instead of "degraded gracefully" during AI outages.
**Resolution Path:** Each AI feature ticket (SGIP-7.2.x) requires explicit fallback implementation. SGIP-7.2.2.1 template explanation, SGIP-7.2.3.1 curated resource list, SGIP-7.2.1.3 graceful no-suggestions state. A synthetic "AI outage" test suite must pass in CI (referenced in PRD Section 7 Success Metrics as the "AI Degradation Resilience" metric).
**Status:** OPEN — resolution distributed across Phase 7 tickets

---

### ISSUE-007 — Evidence Strength (Certificates/Projects) Not Wired to Score Formula in MVP

**Severity:** LOW (intentional deferral, documented)
**Introduced In:** Pre-implementation (Document 1, Section 8, Assumption #2)
**Description:** Certificate uploads and project evidence are tracked and displayed as UI badges but explicitly do NOT affect the readiness score formula in MVP. This is a deliberate deferral, not an omission.
**Impact:** Students with strong evidence (multiple certificates) may feel the score undervalues their demonstrated skills. This is an expected and communicated limitation of MVP.
**Resolution Path:** Document 1 Section 10 (R1) describes evidence-weighted scoring as a future roadmap item. The UI should clearly label skills as "self-assessed" to set expectations. Phase 2+ will introduce evidence-weighted scoring.
**Status:** OPEN (intentional deferral) — resolution in future R1 phase

---

### ISSUE-008 — SSRF Risk from Project Evidence External URLs

**Severity:** MEDIUM
**Introduced In:** Pre-implementation (Document 3, Section 13, OWASP A10 note)
**Description:** FR-DOC-04 allows students to add external project URLs (GitHub, portfolio). If any future feature fetches these URLs server-side (e.g., for link preview/metadata), it must go through an allow-listed/sandboxed fetcher — not a raw server-side fetch of user-supplied URLs.
**Impact:** SSRF vulnerability if link previews are naively implemented in the future.
**Resolution Path:** Per SGIP-3.2.3.2 — external URLs stored and displayed as links ONLY. No server-side fetching implemented in MVP. Any future link-preview feature must have an explicit security review and an allow-listed proxy fetcher.
**Status:** OPEN (standing architectural risk for future features)

---

### ISSUE-009 — Children's Data / Minor User Compliance

**Severity:** HIGH (legal/compliance, not engineering)
**Introduced In:** Pre-implementation (Document 3, Section 14.5)
**Description:** If the platform serves users under 18 (plausible for "students"), applicable child data protection laws (COPPA equivalents, India's DPDP Act) require verifiable parental/guardian consent before launch in those markets.
**Impact:** Legal/regulatory liability if launched without addressing this.
**Resolution Path:** This is flagged as a stakeholder decision point (Document 1, Section 11 Open Questions). Engineering cannot unilaterally resolve this. Escalate to legal/compliance before launch. May involve age verification at registration, or institutional consent via organization agreements.
**Status:** OPEN — requires stakeholder + legal input

---

### ISSUE-010 — i18n Strings Must Be Externalized from Day One

**Severity:** LOW
**Introduced In:** Pre-implementation (Document 1, Section 6 NFR, Internationalization)
**Description:** All user-facing strings must be externalized for i18n from the start, even though actual translation is out of MVP scope. A costly retrofit if deferred.
**Impact:** If strings are hardcoded in components, adding i18n later requires touching every component — a multi-week refactor.
**Resolution Path:** Use i18n libraries (e.g., next-intl for Next.js) from SGIP-1.2.2.1 forward. All user-facing strings go through the i18n key system, even if only English keys exist in MVP. Document this convention in the codebase README.
**Status:** OPEN — resolution in SGIP-1.2.2.1

---

## Resolved Issues

[Issues moved here when fixed, with resolution notes]
