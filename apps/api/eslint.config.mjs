// @ts-check
/**
 * SGIP — API ESLint Configuration
 *
 * Rules are intentionally strict:
 * - TypeScript strict mode across all source files
 * - Prettier integration for formatting enforcement
 * - NestJS-appropriate rules (decorators, async patterns)
 *
 * NOTE: Architecture boundary rules (scoring → ai-gateway) are enforced by
 * dependency-cruiser (SGIP-1.2.1.3), not ESLint. ESLint handles code quality;
 * dependency-cruiser handles module boundary violations.
 */
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // Prisma generated files
      'src/generated/**',
      'prisma/generated/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // ── TypeScript Rules ────────────────────────────────────────────────────
      // Allow explicit any sparingly (NestJS DI patterns sometimes require it)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Floating promises are errors in async code — must be handled
      '@typescript-eslint/no-floating-promises': 'error',
      // Unsafe argument usage should at least warn
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      // Enforce consistent return types on public methods
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Unused variables are errors (except prefixed with _)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // No non-null assertions (use proper null checks)
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // ── General Code Quality ────────────────────────────────────────────────
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'no-throw-literal': 'error',

      // ── Prettier Formatting ─────────────────────────────────────────────────
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
