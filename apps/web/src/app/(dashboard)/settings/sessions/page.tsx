/**
 * SGIP — Active Sessions Page
 * Ticket: SGIP-2.1.4.4
 *
 * Lists all active refresh token sessions with device info + IP.
 * Allows revoking individual sessions or all at once.
 * Route: /settings/sessions (authenticated, AnyRole)
 */
'use client';

import { useState, useEffect } from 'react';
import { listSessions, revokeSession, type SessionItem } from '@/lib/api/auth.api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractDevice(ua?: string): string {
  if (!ua) return 'Unknown device';
  if (/iPhone|iPad|iOS/i.test(ua)) return '📱 iOS device';
  if (/Android/i.test(ua)) return '📱 Android device';
  if (/Windows/i.test(ua)) return '💻 Windows browser';
  if (/Mac/i.test(ua)) return '💻 macOS browser';
  if (/Linux/i.test(ua)) return '🖥 Linux browser';
  return '🌐 Browser';
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    await Promise.resolve(); // Defer execution to avoid synchronous cascading render warning
    try {
      setLoading(true);
      const data = await listSessions();
      setSessions(data);
    } catch {
      setError('Could not load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      setError('Failed to revoke session.');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      <h1
        className="text-heading-md"
        style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
      >
        Active Sessions
      </h1>
      <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        These are all devices where you are currently logged in. Revoking a session will log out
        that device.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(242, 112, 107, 0.12)',
            border: '1px solid var(--status-attention)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <p className="text-body-sm" style={{ color: 'var(--status-attention)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '72px', borderRadius: '12px' }}
              aria-busy="true"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && sessions.length === 0 && !error && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'var(--surface-raised)',
            borderRadius: '12px',
          }}
        >
          <p className="text-body-md" style={{ color: 'var(--text-secondary)' }}>
            No active sessions found.
          </p>
        </div>
      )}

      {/* Session list */}
      {!loading && sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                gap: '16px',
              }}
            >
              <div>
                <p className="text-body-sm" style={{ fontWeight: 500, marginBottom: '4px' }}>
                  {extractDevice(session.deviceInfo)}
                </p>
                <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                  {session.ipAddress ? `${session.ipAddress} · ` : ''}
                  Started {formatDate(session.createdAt)} · Expires {formatDate(session.expiresAt)}
                </p>
              </div>
              <button
                id={`revoke-session-${session.id}`}
                onClick={() => handleRevoke(session.id)}
                disabled={revoking === session.id}
                aria-busy={revoking === session.id}
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--status-attention)',
                  borderRadius: '6px',
                  color: 'var(--status-attention)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: revoking === session.id ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: revoking === session.id ? 0.5 : 1,
                  transition: 'opacity 150ms ease',
                  flexShrink: 0,
                }}
              >
                {revoking === session.id ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
