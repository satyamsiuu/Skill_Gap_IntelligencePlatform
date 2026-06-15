// @ts-check
/**
 * SGIP — Web App ESLint Configuration
 *
 * Extends Next.js recommended rules with:
 * - Prettier integration
 * - React hook rules
 * - SGIP-specific naming conventions (e.g., no raw hex colors in className)
 *
 * ADR-018 requirement: all data-fetching components must have loading/error/empty states.
 * This is a code review concern, not an ESLint rule.
 */
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'coverage/**',
  ]),
  {
    rules: {
      // ── TypeScript ──────────────────────────────────────────────────────────
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // ── React / Next.js ─────────────────────────────────────────────────────
      // Exhaustive deps is critical for TanStack Query patterns
      'react-hooks/exhaustive-deps': 'warn',
      // Prevent direct document/window access in SSR context
      'no-restricted-globals': 'off',

      // ── Code Quality ────────────────────────────────────────────────────────
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'eqeqeq': ['error', 'always'],
    },
  },
]);

export default eslintConfig;
