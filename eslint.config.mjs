import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import boundaries from 'eslint-plugin-boundaries'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // Architecture layers (docs/MIGRATION_PLAN.md §1): app → widgets/blocks → shared.
    // `payload` (CMS schema) may use blocks' configs; blocks/widgets/shared never import app.
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**', partialMatch: false },
        { type: 'payload', pattern: 'src/payload/**', partialMatch: false },
        { type: 'blocks', pattern: 'src/blocks/*', capture: ['block'] },
        { type: 'content-blocks', pattern: 'src/content-blocks/*', capture: ['block'] },
        { type: 'widgets', pattern: 'src/widgets/*', capture: ['widget'] },
        { type: 'shared', pattern: 'src/shared/**', partialMatch: false },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        2,
        {
          default: 'disallow',
          policies: [
            { allow: { to: { element: { types: ['shared'] } } } },
            {
              from: { element: { types: ['app'] } },
              allow: {
                to: { element: { types: ['app', 'payload', 'blocks', 'content-blocks', 'widgets'] } },
              },
            },
            {
              from: { element: { types: ['payload'] } },
              allow: { to: { element: { types: ['payload', 'blocks', 'content-blocks'] } } },
            },
            {
              from: { element: { types: ['blocks'] } },
              allow: { to: { element: { types: ['content-blocks', 'widgets'] } } },
            },
            {
              // content blocks nest inside each other's rich text (a callout in a flex block …)
              from: { element: { types: ['content-blocks'] } },
              allow: { to: { element: { types: ['content-blocks'] } } },
            },
            {
              from: { element: { types: ['widgets'] } },
              allow: { to: { element: { types: ['content-blocks'] } } },
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['.next/', 'old-site/', 'src/app/(payload)/admin/importMap.js', 'src/payload-types.ts', 'src/payload-generated-schema.ts', 'src/migrations/'],
  },
]

export default eslintConfig
