/**
 * SGIP — Auth Shell Layout
 * Tickets: SGIP-2.1.1.3, SGIP-2.1.2.4
 *
 * Wraps all auth pages (/login, /register, /verify-email, /reset-password).
 * Two-panel layout: left = aurora wash hero, right = form.
 * Aurora gradient wash on the left panel is one of 3 permitted ADR-010 use cases.
 */
import type { ReactNode } from 'react';

export const metadata = {
  title: { default: 'Sign In | SGIP', template: '%s | SGIP' },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '100dvh',
        backgroundColor: 'var(--canvas)',
      }}
    >
      {/* Left: Aurora hero panel (ADR-010 permitted use #3) */}
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        {/* Aurora wash at 8% opacity — ADR-010 §3.4 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--aurora)',
            opacity: 0.08,
          }}
        />

        {/* Decorative content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '360px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'var(--aurora)',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '28px' }}>⬡</span>
          </div>
          <h1
            className="text-display-md"
            style={{ fontFamily: 'var(--font-geist)', marginBottom: '16px' }}
          >
            Skill Gap Intelligence Platform
          </h1>
          <p className="text-body-md" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            Know exactly where you stand for your target role. A deterministic readiness score
            backed by real skill data.
          </p>

          {/* Feature list */}
          <div
            style={{
              marginTop: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left',
            }}
          >
            {[
              'Precise skill gap analysis',
              'AI-enhanced learning roadmap',
              'Readiness score you can trust',
            ].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--status-strong)', fontSize: '16px' }}>✓</span>
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>{children}</div>
      </div>
    </div>
  );
}
