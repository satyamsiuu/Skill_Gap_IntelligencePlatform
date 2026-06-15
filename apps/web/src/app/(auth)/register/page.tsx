/**
 * SGIP — Registration Page
 * Ticket: SGIP-2.1.1.3
 *
 * Four mandatory states (Document 4 §12, ADR-018):
 * Loading → form submitting state
 * Error → field-level + form-level errors
 * Empty → initial form (invitation to act)
 * Populated → success message after registration
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerUser } from '@/lib/api/auth.api';

const schema = z
  .object({
    email: z.string().email('Please enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password is too long.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');
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
      const result = await registerUser({ email: data.email, password: data.password });
      setSuccessEmail(result.email);
      setSuccess(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  };

  // ── Populated: Success state ───────────────────────────────────────────────
  if (success) {
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
          }}
        >
          ✓
        </div>
        <h1
          className="text-heading-md"
          style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
        >
          Check your inbox
        </h1>
        <p
          className="text-body-md"
          style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}
        >
          We sent a verification link to{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{successEmail}</strong>. Click it to
          activate your account.
        </p>
        <p className="text-body-sm" style={{ color: 'var(--text-tertiary)' }}>
          Already verified?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // ── Empty + Loading + Error: Form state ───────────────────────────────────
  return (
    <div>
      <h1
        className="text-heading-md"
        style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
      >
        Create your account
      </h1>
      <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>

      {/* Form-level error banner (Document 4 §14) */}
      {serverError && (
        <div
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
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="text-body-sm"
            style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}
          >
            Email address
          </label>
          <input
            id="email"
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
              style={{ color: 'var(--status-attention)', marginTop: '4px' }}
            >
              ⚠ {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="text-body-sm"
            style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
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
              style={{ color: 'var(--status-attention)', marginTop: '4px' }}
            >
              ⚠ {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="text-body-sm"
            style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
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

        {/* Submit */}
        <button
          id="register-submit-btn"
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p
        className="text-caption"
        style={{ color: 'var(--text-tertiary)', marginTop: '20px', textAlign: 'center' }}
      >
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
