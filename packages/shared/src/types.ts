/**
 * SGIP — Shared Types
 *
 * This file contains all shared enums, interfaces, and type definitions
 * used across apps/api and apps/web. These are the canonical type definitions
 * that prevent drift between frontend and backend expectations.
 *
 * IMPORTANT: These are TypeScript types only — no runtime code.
 * All business logic lives in apps/api (NestJS).
 */

// ─────────────────────────────────────────────────────────────────────────────
// User & Authentication
// ─────────────────────────────────────────────────────────────────────────────

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  // Future: GOOGLE, MICROSOFT — nullable fields ready per ADR-009 in ARCHITECTURE_DECISIONS.md
}

// ─────────────────────────────────────────────────────────────────────────────
// Student Skills
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Source of a StudentSkill record.
 * SELF = student manually added
 * AI_SUGGESTED = AI extracted from resume, pending student review
 * AI_CONFIRMED = student explicitly accepted an AI suggestion
 */
export enum SkillSource {
  SELF = 'SELF',
  AI_SUGGESTED = 'AI_SUGGESTED',
  AI_CONFIRMED = 'AI_CONFIRMED',
}

/**
 * Status of a StudentSkill record.
 * IMPORTANT (ADR-004): Only CONFIRMED skills contribute to the readiness score.
 * PENDING_REVIEW skills MUST be excluded from all score calculations.
 */
export enum SkillStatus {
  CONFIRMED = 'CONFIRMED',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

/**
 * Proficiency display bands (Document 4, Section 4.1).
 * Internal storage: integer 1–5 (ADR-007).
 * Display: these three bands.
 */
export enum ProficiencyBand {
  BEGINNER = 'BEGINNER', // 1–2
  INTERMEDIATE = 'INTERMEDIATE', // 3
  ADVANCED = 'ADVANCED', // 4–5
}

/**
 * Maps internal 1–5 proficiency to the 3-band display label.
 * Consistent across frontend and backend.
 */
export function getProficiencyBand(proficiency: number): ProficiencyBand {
  if (proficiency <= 2) return ProficiencyBand.BEGINNER;
  if (proficiency === 3) return ProficiencyBand.INTERMEDIATE;
  return ProficiencyBand.ADVANCED;
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Requirements & Scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Importance weight for a role requirement.
 * Maps to scoring weights (Document 2, Section 4.5):
 * REQUIRED = 3, IMPORTANT = 2, NICE_TO_HAVE = 1 (configurable via PlatformConfig)
 */
export enum RequirementImportance {
  REQUIRED = 'REQUIRED',
  IMPORTANT = 'IMPORTANT',
  NICE_TO_HAVE = 'NICE_TO_HAVE',
}

/**
 * Classification of a skill requirement in the gap report (Document 2, Section 4.5).
 * MATCHED = studentProficiency >= targetProficiency
 * PARTIAL = 0 < studentProficiency < targetProficiency
 * MISSING = studentProficiency == 0 (skill not present)
 */
export enum GapClassification {
  MATCHED = 'MATCHED',
  PARTIAL = 'PARTIAL',
  MISSING = 'MISSING',
}

/**
 * Human-readable readiness score bands (Document 4, Section 3.5).
 * STRONG >= 75, DEVELOPING 40–74, ATTENTION < 40
 */
export enum ReadinessBand {
  STRONG = 'STRONG', // >= 75, --status-strong color, aurora gradient on ring arc
  DEVELOPING = 'DEVELOPING', // 40–74, --status-developing color
  ATTENTION = 'ATTENTION', // < 40, --status-attention color
  UNASSESSED = 'UNASSESSED', // No target role or no snapshot yet
}

export function getReadinessBand(score: number): ReadinessBand {
  if (score >= 75) return ReadinessBand.STRONG;
  if (score >= 40) return ReadinessBand.DEVELOPING;
  return ReadinessBand.ATTENTION;
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents & File Upload
// ─────────────────────────────────────────────────────────────────────────────

export enum DocumentType {
  RESUME = 'RESUME',
  CERTIFICATE = 'CERTIFICATE',
  PROJECT_EVIDENCE = 'PROJECT_EVIDENCE',
}

/**
 * File scan status lifecycle (Document 3, Section 7.1).
 * Files MUST NOT be parsed or made accessible until status = AVAILABLE.
 */
export enum FileScanStatus {
  QUARANTINED = 'QUARANTINED', // Uploaded, pending scan
  AVAILABLE = 'AVAILABLE', // Clean — eligible for parsing/download
  REJECTED = 'REJECTED', // Infected — deleted from storage, user notified
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization Engine
// ─────────────────────────────────────────────────────────────────────────────

export enum NormalizationEntityType {
  SKILL = 'SKILL',
  ROLE = 'ROLE',
}

export enum NormalizationReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED', // Approved as new canonical entry
  MERGED = 'MERGED', // Merged as alias of existing entry
  REJECTED = 'REJECTED', // Rejected — provisional links reverted
}

// ─────────────────────────────────────────────────────────────────────────────
// Roadmap
// ─────────────────────────────────────────────────────────────────────────────

export enum RoadmapItemStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Usage Logging
// ─────────────────────────────────────────────────────────────────────────────

export enum AIProvider {
  GROQ = 'GROQ',
  OPENAI = 'OPENAI', // Future
  ANTHROPIC = 'ANTHROPIC', // Future
}

export enum AIFeature {
  RESUME_EXTRACTION = 'RESUME_EXTRACTION',
  SCORE_EXPLANATION = 'SCORE_EXPLANATION',
  ROADMAP_ENRICHMENT = 'ROADMAP_ENRICHMENT',
  NORMALIZATION_DISAMBIGUATION = 'NORMALIZATION_DISAMBIGUATION',
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log
// ─────────────────────────────────────────────────────────────────────────────

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ─────────────────────────────────────────────────────────────────────────────
// API Response Shapes (Shared Contracts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard API error envelope.
 * All API errors (4xx, 5xx) conform to this shape.
 * Field-level errors are included for validation failures (400).
 */
export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Standard API response wrapper.
 * All successful API responses are wrapped in this shape.
 */
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Breakdown Item (ReadinessSnapshot.breakdown JSONB structure)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-requirement breakdown stored in ReadinessSnapshot.breakdown JSONB.
 * Stored at calculation time so the gap report remains stable even after
 * RoleRequirementSet updates. (Document 2, Section 4.4 — ADR-013)
 */
export interface BreakdownItem {
  skillId: string;
  skillName: string;
  importance: RequirementImportance;
  targetProficiency: number;
  studentProficiency: number; // 0 if skill not present
  classification: GapClassification;
  priorityOrder?: number; // Set when RoadmapItem is generated
}
