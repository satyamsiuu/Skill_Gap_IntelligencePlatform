/**
 * SGIP — Login Page
 * Ticket: SGIP-2.1.2.4
 *
 * Stores access token in memory (not localStorage — XSS protection).
 * Refresh token is httpOnly cookie set by the server automatically.
 * Redirects to /dashboard on success.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginUser } from '@/lib/api/auth.api';

const schema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.').max(128),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const result = await loginUser(data);
      // Store access token in sessionStorage (tab-scoped, not persisted to disk)
      // Refresh token is in the httpOnly cookie — server manages it
      sessionStorage.setItem('sgip_access_token', result.accessToken);
      // eslint-disable-next-line react-hooks/purity
      sessionStorage.setItem('sgip_token_expiry', String(Date.now() + result.expiresIn * 1000));
      router.push('/dashboard');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.',
      );
    }
  };

  return (
    <div>
      <h1
        className="text-heading-md"
        style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
      >
        Sign in to SGIP
      </h1>
      <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        New here?{' '}
        <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Create an account
        </Link>
      </p>

      {serverError && (
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
            {serverError}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div>
          <label
            htmlFor="login-email"
            className="text-body-sm"
            style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}
          >
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'var(--surface-raised)',
              border: `1px solid ${errors.email ? 'var(--status-attention)' : 'var(--border-strong)'}`,
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          {errors.email && (
            <p
              className="text-caption"
              role="alert"
              style={{ color: 'var(--status-attention)', marginTop: '4px' }}
            >
              ⚠ {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label
              htmlFor="login-password"
              className="text-body-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-body-sm"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            {...register('password')}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'var(--surface-raised)',
              border: `1px solid ${errors.password ? 'var(--status-attention)' : 'var(--border-strong)'}`,
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          {errors.password && (
            <p
              className="text-caption"
              role="alert"
              style={{ color: 'var(--status-attention)', marginTop: '4px' }}
            >
              ⚠ {errors.password.message}
            </p>
          )}
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSubmitting ? 'var(--border-strong)' : 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 150ms ease',
            marginTop: '8px',
          }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
