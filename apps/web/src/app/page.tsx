/**
 * SGIP — Home Page (Placeholder)
 * Redirects to the appropriate route based on auth state.
 * In Phase 1 (no auth), shows a platform bootstrap indicator.
 */
import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        backgroundColor: 'var(--canvas)',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p
          className="text-heading-sm"
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '8px',
            fontFamily: 'var(--font-geist)',
          }}
        >
          Skill Gap Intelligence Platform
        </p>
        <h1 className="text-display-md" style={{ fontFamily: 'var(--font-geist)' }}>
          Phase 1 — Foundation Complete
        </h1>
        <p
          className="text-body-md"
          style={{ color: 'var(--text-secondary)', marginTop: '12px', maxWidth: '480px' }}
        >
          Authentication and core features are being implemented in Phase 2. The platform
          infrastructure is ready.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/design-tokens"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          View Design System →
        </Link>
        <a
          href="http://localhost:4000/health"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
          }}
        >
          API Health Check ↗
        </a>
      </div>

      <p className="text-data-sm" style={{ color: 'var(--text-tertiary)' }}>
        Phase 1: 21/21 · Phase 2: 0/12
      </p>
    </main>
  );
}
