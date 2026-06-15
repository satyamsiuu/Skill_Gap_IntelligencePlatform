/** @type {import('@typescript-eslint/eslint-plugin').TSESLint.FlatConfig[]} */
const config = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/coverage/**',
    ],
  },
];

export default config;
