import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import astro from 'eslint-plugin-astro'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.private/',
      '**/dist/',
      '**/coverage/',
      '**/.astro/',
      '**/.wrangler/',
      '**/*.md',
      'pnpm-lock.yaml',
    ],
  },

  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,

  {
    // Runtime-agnostic: `crypto` comes from whichever of the two is present.
    files: ['pkg/src/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['pages/src/**/*.{ts,astro}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.config.{ts,mjs}'],
    languageOptions: { globals: globals.node },
  },

  prettier,
)
