/**
 * SGIP — Design Token Demo Page
 * Ticket: SGIP-1.2.2.2 (Acceptance Criteria validation)
 *
 * AC: "Switching a data-theme attribute toggles between dark and light token sets
 *      without a page reload."
 * AC: "A sample page demonstrates display-md, body-md, and data-md typography
 *      tokens rendering with the correct fonts."
 * AC: "Semantic status colors are defined as reusable tokens, not hardcoded per-component."
 *
 * This page is only accessible in development. Remove or guard behind auth in production.
 */
'use client';

import { useTheme } from '@/hooks/use-theme';

// ── Status badge component demonstrating semantic color tokens ────────────────
function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: 'strong' | 'developing' | 'attention' | 'neutral';
}) {
  const colorMap = {
    strong: 'bg-status-strong',
    developing: 'bg-status-developing',
    attention: 'bg-status-attention',
    neutral: 'bg-status-neutral',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption ${colorMap[variant]} text-canvas`}
      style={{ backgroundColor: `var(--status-${variant})` }}
    >
      {label}
    </span>
  );
}

// ── Token row component ───────────────────────────────────────────────────────
function TokenSwatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg border border-border-subtle flex-shrink-0"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div>
        <p className="text-body-sm text-text-primary font-mono">{name}</p>
        <p className="text-caption text-text-tertiary font-mono">{cssVar}</p>
      </div>
    </div>
  );
}

export default function DesignTokensPage() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div>
          <h1 className="text-heading-sm" style={{ fontFamily: 'var(--font-geist)' }}>
            SGIP Design Token System
          </h1>
          <p
            className="text-caption"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-inter)' }}
          >
            SGIP-1.2.2.2 AC Validation — Document 4 §3–5
          </p>
        </div>

        {/* Theme toggle — demonstrates data-theme switching without page reload */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-inter)',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          {isDark ? '☀ Light Mode' : '◗ Dark Mode'}
        </button>
      </header>

      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Current Theme Indicator */}
        <div
          className="card"
          style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-strong)',
              display: 'inline-block',
            }}
          />
          <span className="text-body-md">
            Current theme:{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>
              [data-theme=&quot;{theme}&quot;]
            </strong>{' '}
            — toggle switches instantly without page reload ✓
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          {/* ── Typography Tokens ──────────────────────────────────────────── */}
          <section className="card" style={{ gridColumn: 'span 2' }}>
            <h2
              className="text-heading-sm"
              style={{
                fontFamily: 'var(--font-geist)',
                marginBottom: '24px',
                color: 'var(--text-secondary)',
              }}
            >
              Typography Scale — Document 4 §4.2
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}
                >
                  display-lg · 40px · 600 · Geist Sans
                </p>
                <p className="text-display-lg">Skill Gap Intelligence</p>
              </div>
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}
                >
                  display-md · 28px · 600 · Geist Sans
                </p>
                <p className="text-display-md">Your Readiness: Full Stack Developer</p>
              </div>
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}
                >
                  heading-md · 20px · 600 · Geist Sans
                </p>
                <p className="text-heading-md">Gap Report Overview</p>
              </div>
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}
                >
                  heading-sm · 16px · 600 · Geist Sans
                </p>
                <p className="text-heading-sm">Required Skills</p>
              </div>
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}
                >
                  body-md · 14px · 400 · Inter — default body text
                </p>
                <p className="text-body-md">
                  Your readiness score reflects your current skill profile against the published
                  requirements for this role. Complete the suggested roadmap items to improve your
                  score.
                </p>
              </div>
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}
                >
                  body-sm · 13px · 400 · Inter
                </p>
                <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                  Last recalculated 2 minutes ago · Based on 14 self-assessed skills
                </p>
              </div>
              <hr style={{ borderColor: 'var(--border-subtle)' }} />
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}
                >
                  data-lg · 36px · 500 · Geist Mono — Readiness Score hero
                </p>
                <p className="text-data-lg" style={{ color: 'var(--accent)' }}>
                  72
                </p>
              </div>
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}
                >
                  data-md · 18px · 500 · Geist Mono — in-table scores
                </p>
                <p className="text-data-md">4 / 5 · 80%</p>
              </div>
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}
                >
                  data-sm · 12px · 500 · Geist Mono — timestamps, IDs
                </p>
                <p className="text-data-sm" style={{ color: 'var(--text-tertiary)' }}>
                  2026-06-15T17:15:00+05:30 · usr_01j...
                </p>
              </div>
            </div>
          </section>

          {/* ── Color Tokens — Neutral/Surface ─────────────────────────────── */}
          <section className="card">
            <h2
              className="text-heading-sm"
              style={{
                fontFamily: 'var(--font-geist)',
                marginBottom: '24px',
                color: 'var(--text-secondary)',
              }}
            >
              Surface Tokens — §3.2
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <TokenSwatch name="--canvas" cssVar="--canvas" />
              <TokenSwatch name="--surface" cssVar="--surface" />
              <TokenSwatch name="--surface-raised" cssVar="--surface-raised" />
              <TokenSwatch name="--border-subtle" cssVar="--border-subtle" />
              <TokenSwatch name="--border-strong" cssVar="--border-strong" />
              <hr style={{ borderColor: 'var(--border-subtle)' }} />
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <p className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
                  --text-primary
                </p>
                <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                  --text-secondary
                </p>
                <p className="text-body-sm" style={{ color: 'var(--text-tertiary)' }}>
                  --text-tertiary
                </p>
              </div>
            </div>
          </section>

          {/* ── Semantic Status Colors ─────────────────────────────────────── */}
          <section className="card">
            <h2
              className="text-heading-sm"
              style={{
                fontFamily: 'var(--font-geist)',
                marginBottom: '24px',
                color: 'var(--text-secondary)',
              }}
            >
              Semantic Colors — §3.5
            </h2>
            <p
              className="text-body-sm"
              style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}
            >
              Defined as reusable CSS variables, not hardcoded per-component. ✓
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <TokenSwatch name="--status-strong (≥75 / MATCHED)" cssVar="--status-strong" />
              <TokenSwatch
                name="--status-developing (40–74 / PARTIAL)"
                cssVar="--status-developing"
              />
              <TokenSwatch name="--status-attention (<40 / MISSING)" cssVar="--status-attention" />
              <TokenSwatch name="--status-neutral (not assessed)" cssVar="--status-neutral" />
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <StatusBadge label="✓ Matched" variant="strong" />
              <StatusBadge label="~ Partial" variant="developing" />
              <StatusBadge label="✕ Missing" variant="attention" />
              <StatusBadge label="— Unassessed" variant="neutral" />
            </div>
          </section>

          {/* ── Accent Tokens ─────────────────────────────────────────────── */}
          <section className="card">
            <h2
              className="text-heading-sm"
              style={{
                fontFamily: 'var(--font-geist)',
                marginBottom: '24px',
                color: 'var(--text-secondary)',
              }}
            >
              Accent / Brand — §3.3
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <TokenSwatch name="--accent (primary)" cssVar="--accent" />
              <TokenSwatch name="--accent-hover" cssVar="--accent-hover" />
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--accent-muted-bg)',
                  borderRadius: '8px',
                }}
              >
                <p className="text-body-sm" style={{ color: 'var(--accent)' }}>
                  --accent-muted-bg (12% opacity) — selected rows, highlights
                </p>
              </div>
              <button
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
              >
                Primary Button (accent)
              </button>
            </div>
          </section>

          {/* ── Aurora Gradient (restricted) ──────────────────────────────── */}
          <section className="card">
            <h2
              className="text-heading-sm"
              style={{
                fontFamily: 'var(--font-geist)',
                marginBottom: '8px',
                color: 'var(--text-secondary)',
              }}
            >
              Aurora Gradient — §3.4 (Restricted)
            </h2>
            <p
              className="text-body-sm"
              style={{ color: 'var(--status-attention)', marginBottom: '16px' }}
            >
              ADR-010: 3 permitted uses ONLY
            </p>
            <div
              style={{
                height: '80px',
                borderRadius: '8px',
                background: 'var(--aurora)',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                height: '80px',
                borderRadius: '8px',
                background: 'var(--aurora)',
                opacity: 0.08,
                marginBottom: '12px',
              }}
            />
            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Top: full opacity (Ring arc at score ≥90)
              <br />
              Bottom: 8% opacity (onboarding hero wash)
            </p>
          </section>

          {/* ── Component Primitives ──────────────────────────────────────── */}
          <section className="card">
            <h2
              className="text-heading-sm"
              style={{
                fontFamily: 'var(--font-geist)',
                marginBottom: '24px',
                color: 'var(--text-secondary)',
              }}
            >
              Component Primitives
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Skeleton */}
              <div>
                <p
                  className="text-caption"
                  style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }}
                >
                  Skeleton shimmer
                </p>
                <div
                  className="skeleton"
                  style={{ height: '20px', width: '60%', marginBottom: '8px', borderRadius: '4px' }}
                />
                <div
                  className="skeleton"
                  style={{ height: '20px', width: '80%', marginBottom: '8px', borderRadius: '4px' }}
                />
                <div
                  className="skeleton"
                  style={{ height: '20px', width: '45%', borderRadius: '4px' }}
                />
              </div>
              {/* AI insight block */}
              <div className="ai-insight-block">
                <p className="text-caption" style={{ color: 'var(--accent)', marginBottom: '4px' }}>
                  AI
                </p>
                <p className="text-body-sm">
                  To close your TypeScript gap, consider building a full-stack project using NestJS
                  + Next.js with strict mode enabled.
                </p>
              </div>
              {/* Card variants */}
              <div className="card card-hover" style={{ cursor: 'pointer' }}>
                <p className="text-body-sm">Hover over this card ↓</p>
                <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                  background + border transition on hover
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
