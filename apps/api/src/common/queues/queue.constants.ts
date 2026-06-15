/**
 * SGIP — BullMQ Queue Constants
 * Ticket: SGIP-1.1.3.2
 *
 * Canonical queue names from Document 2 §7.2.
 * These MUST match across all producers (API) and consumers (Worker).
 * Changing a queue name requires coordination across both processes.
 *
 * ┌────────────────────────┬──────────────────────────────────────────────────┐
 * │ Queue Name             │ Purpose                                          │
 * ├────────────────────────┼──────────────────────────────────────────────────┤
 * │ sgip.documents         │ Resume/document parsing + text extraction        │
 * │ sgip.normalization     │ Skill/role embedding generation + similarity      │
 * │ sgip.scoring           │ Readiness score recalculation                    │
 * │ sgip.roadmap           │ Roadmap AI enrichment (resource suggestions)     │
 * └────────────────────────┴──────────────────────────────────────────────────┘
 *
 * Job name constants within each queue follow the pattern:
 *   <queue>.<operation>
 * Example: sgip.documents.parse, sgip.normalization.embed
 */

export const QUEUE_NAMES = {
  DOCUMENTS: 'sgip.documents',
  NORMALIZATION: 'sgip.normalization',
  SCORING: 'sgip.scoring',
  ROADMAP: 'sgip.roadmap',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Job name constants — producers and processors reference these, not raw strings
export const JOB_NAMES = {
  // sgip.documents queue jobs
  DOCUMENTS: {
    PARSE: 'sgip.documents.parse',
    ANTIVIRUS_SCAN: 'sgip.documents.antivirus.scan',
  },
  // sgip.normalization queue jobs
  NORMALIZATION: {
    EMBED_SKILL: 'sgip.normalization.embed.skill',
    EMBED_ROLE: 'sgip.normalization.embed.role',
    NORMALIZE_CANDIDATE: 'sgip.normalization.normalize.candidate',
  },
  // sgip.scoring queue jobs
  SCORING: {
    RECALCULATE: 'sgip.scoring.recalculate',
    RECALCULATE_BULK: 'sgip.scoring.recalculate.bulk',
    EXPLAIN: 'sgip.scoring.explain', // AI explanation — NOT on scoring path (ADR-002)
  },
  // sgip.roadmap queue jobs
  ROADMAP: {
    ENRICH: 'sgip.roadmap.enrich', // AI resource suggestion enrichment
  },
} as const;
