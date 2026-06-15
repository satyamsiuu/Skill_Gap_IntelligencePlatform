/**
 * SGIP — Dependency Cruiser Configuration
 * Ticket: SGIP-1.2.1.3
 *
 * Encodes the Module Boundary Law (ADR-001) and the Non-Negotiable Architectural Laws.
 * These rules RUN IN CI on every PR. A violation fails the build.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * RULE RATIONALE (read before modifying any rule)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * RULE 1: no-scoring-imports-ai-gateway
 *   The Readiness Score is the platform's core trust-bearing number.
 *   If scoring ever imports AI Gateway, the score can only be computed
 *   when the AI provider is available — violating the AI Independence Law (ADR-002).
 *   This rule makes it IMPOSSIBLE to accidentally break this invariant.
 *
 * RULE 2: no-non-gateway-imports-groq
 *   The AI Gateway Singleton Law (ADR-003). All LLM provider SDKs must go
 *   through the AIGatewayPort interface. Directly importing @groq/* or similar
 *   from a feature module bypasses the circuit breaker, response cache, and
 *   provider router — making it impossible to swap providers without code changes.
 *
 * RULE 3: no-circular-dependencies
 *   Circular dependencies in NestJS modules cause startup errors and make the
 *   module graph impossible to reason about.
 *
 * RULE 4: no-scoring-imports-normalization
 *   The Scoring Engine computes scores against CONFIRMED StudentSkill rows
 *   and RoleRequirementSet data. It must not import the Normalization module
 *   (which is AI-adjacent and creates PENDING_REVIEW skills).
 *
 * RULE 5: no-feature-modules-import-workers
 *   Worker processors are registered in the WorkerModule. Feature modules
 *   should never import from the workers directory — they enqueue jobs
 *   via the QueueModule (injecting Queue tokens), not by importing processors.
 *
 * To test a rule: introduce the forbidden import, run `pnpm depcruise:check`,
 * confirm it errors, then remove the import.
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ────────────────────────────────────────────────────────────────────────
    // RULE 1: The AI Independence Law (ADR-002)
    // Scoring Engine module MUST NOT import AI Gateway
    // ────────────────────────────────────────────────────────────────────────
    {
      name: 'no-scoring-imports-ai-gateway',
      severity: 'error',
      comment:
        'ADR-002 (AI Independence Law): The Scoring Engine must work without any AI provider. ' +
        'If scoring imports ai-gateway, score computation fails when AI is down. ' +
        'Score explanations arrive async via the sgip.scoring queue — never in the sync score path.',
      from: { path: '^src/scoring' },
      to: { path: '^src/ai-gateway' },
    },

    // ────────────────────────────────────────────────────────────────────────
    // RULE 2: The AI Gateway Singleton Law (ADR-003)
    // Only ai-gateway module may import LLM provider SDKs
    // ────────────────────────────────────────────────────────────────────────
    {
      name: 'no-non-gateway-imports-groq-sdk',
      severity: 'error',
      comment:
        'ADR-003 (AI Gateway Singleton Law): Only the ai-gateway module may import any LLM provider SDK. ' +
        'Direct SDK imports in other modules bypass the circuit breaker, response cache, and provider router.',
      from: { path: '^src', pathNot: '^src/ai-gateway' },
      to: { path: '^groq-sdk|@groq|groq$' },
    },
    {
      name: 'no-non-gateway-imports-openai-sdk',
      severity: 'error',
      comment:
        'ADR-003: Same as above, for OpenAI SDK (even though not currently used — future-proofing).',
      from: { path: '^src', pathNot: '^src/ai-gateway' },
      to: { path: '^openai' },
    },

    // ────────────────────────────────────────────────────────────────────────
    // RULE 3: Circular Dependencies
    // ────────────────────────────────────────────────────────────────────────
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Circular module dependencies cause NestJS startup failures and make the dependency graph impossible to reason about.',
      from: {},
      to: { circular: true },
    },

    // ────────────────────────────────────────────────────────────────────────
    // RULE 4: Scoring must not import Normalization
    // ────────────────────────────────────────────────────────────────────────
    {
      name: 'no-scoring-imports-normalization',
      severity: 'error',
      comment:
        'ADR-002: The Scoring Engine works only with CONFIRMED StudentSkill rows. ' +
        'Normalization creates PENDING_REVIEW skills (which must NOT affect the score). ' +
        'Importing normalization from scoring creates an implicit dependency on the AI path.',
      from: { path: '^src/scoring' },
      to: { path: '^src/normalization' },
    },

    // ────────────────────────────────────────────────────────────────────────
    // RULE 5: Feature modules must not import Worker processors
    // ────────────────────────────────────────────────────────────────────────
    {
      name: 'no-feature-modules-import-workers',
      severity: 'error',
      comment:
        'Feature modules enqueue jobs by injecting Queue tokens from QueueModule. ' +
        'They must not import worker processor classes directly — that would create ' +
        'a tight coupling between the API process and the Worker process codepaths. ' +
        'Exception: main-worker.ts is the worker process entrypoint and MUST import WorkerModule.',
      from: { path: '^src', pathNot: '^src/(workers|main-worker)' },
      to: { path: '^src/workers' },
    },

    // ────────────────────────────────────────────────────────────────────────
    // RULE 6: No orphaned modules (warn only — doesn't block CI)
    // ────────────────────────────────────────────────────────────────────────
    {
      name: 'no-orphans',
      severity: 'warn',
      comment:
        'Files not imported by anything are usually dead code or misplaced files.',
      from: {
        orphan: true,
        pathNot: '^(src/main|src/main-worker|src/app\.service)\.ts$',
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    externalModuleResolutionStrategy: 'node_modules',
    combinedDependencies: false,
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },
    progress: { type: 'performance-log' },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
