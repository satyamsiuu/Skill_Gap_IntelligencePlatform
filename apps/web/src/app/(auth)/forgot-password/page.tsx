/**
 * SGIP — Forgot Password Page
 * Ticket: SGIP-2.1.3.1
 *
 * Submits email, shows generic success message regardless of whether email exists
 * (prevents user enumeration — Document 3 §2.3).
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPassword } from '@/lib/api/auth.api';

const schema = z.object({ email: z.string().email('Please enter a valid email address.') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await forgotPassword(data.email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center' }}>
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
          If that email address is registered, you will receive a password reset link shortly.
        </p>
        <Link
          href="/login"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
          className="text-body-sm"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="text-heading-md"
        style={{ fontFamily: 'var(--font-geist)', marginBottom: '8px' }}
      >
        Reset your password
      </h1>
      <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Enter your email address and we&apos;ll send you a reset link.
      </p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div>
          <label
            htmlFor="forgot-email"
            className="text-body-sm"
            style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}
          >
            Email address
          </label>
          <input
            id="forgot-email"
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
        <button
          id="forgot-submit-btn"
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
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link
          href="/login"
          className="text-body-sm"
          style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
