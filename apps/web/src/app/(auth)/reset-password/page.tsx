/**
 * SGIP — Reset Password Page
 * Ticket: SGIP-2.1.3.2
 *
 * Reads ?token= from URL, lets user set new password.
 * On success, redirects to /login.
 */
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/api/auth.api';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters.').max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1
          className="text-heading-md"
          style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
        >
          Invalid link
        </h1>
        <p
          className="text-body-md"
          style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}
        >
          This reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
          className="text-body-sm"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await resetPassword({ token, newPassword: data.newPassword });
      router.push('/login?reset=success');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Reset failed. The link may have expired.',
      );
    }
  };

  return (
    <div>
      <h1
        className="text-heading-md"
        style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
      >
        Set new password
      </h1>
      <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Choose a strong password you haven&apos;t used before.
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
            htmlFor="new-password"
            className="text-body-sm"
            style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register('newPassword')}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'var(--surface-raised)',
              border: `1px solid ${errors.newPassword ? 'var(--status-attention)' : 'var(--border-strong)'}`,
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          {errors.newPassword && (
            <p
              className="text-caption"
              style={{ color: 'var(--status-attention)', marginTop: '4px' }}
            >
              ⚠ {errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="text-body-sm"
            style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            {...register('confirmPassword')}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'var(--surface-raised)',
              border: `1px solid ${errors.confirmPassword ? 'var(--status-attention)' : 'var(--border-strong)'}`,
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          {errors.confirmPassword && (
            <p
              className="text-caption"
              style={{ color: 'var(--status-attention)', marginTop: '4px' }}
            >
              ⚠ {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <button
          id="reset-submit-btn"
          type="submit"
          disabled={isSubmitting}
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
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
