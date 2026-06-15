/**
 * SGIP — Verify Email Page
 * Ticket: SGIP-2.1.1.3
 *
 * Reads ?token= from URL query params, sends to API on mount.
 * Four states: loading, error, empty (no token), success.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/api/auth.api';

type State = 'loading' | 'success' | 'error' | 'no-token';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>(token ? 'loading' : 'no-token');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then((r) => {
        setMessage(r.message);
        setState('success');
      })
      .catch((e: Error) => {
        setMessage(e.message);
        setState('error');
      });
  }, [token]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          className="skeleton"
          style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px' }}
          aria-busy="true"
        />
        <p className="text-body-md" style={{ color: 'var(--text-secondary)' }}>
          Verifying your email…
        </p>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(61, 214, 140, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px',
            color: 'var(--status-strong)',
          }}
        >
          ✓
        </div>
        <h1
          className="text-heading-md"
          style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
        >
          Email verified!
        </h1>
        <p
          className="text-body-md"
          style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}
        >
          {message}
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Sign in →
        </Link>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(242, 112, 107, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px',
            color: 'var(--status-attention)',
          }}
        >
          ✕
        </div>
        <h1
          className="text-heading-md"
          style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
        >
          Verification failed
        </h1>
        <p
          className="text-body-md"
          style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}
        >
          {message}
        </p>
        <Link
          href="/register"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
          className="text-body-sm"
        >
          Back to registration
        </Link>
      </div>
    );
  }

  // ── Empty: No token in URL ─────────────────────────────────────────────────
  return (
    <div style={{ textAlign: 'center' }}>
      <h1
        className="text-heading-md"
        style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
      >
        Invalid link
      </h1>
      <p className="text-body-md" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        This verification link is invalid or has expired. Request a new one from the registration
        page.
      </p>
      <Link
        href="/register"
        style={{ color: 'var(--accent)', textDecoration: 'none' }}
        className="text-body-sm"
      >
        Back to registration
      </Link>
    </div>
  );
}
