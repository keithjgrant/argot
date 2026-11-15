// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const browserGlobals = {
  document: 'readonly',
  window: 'readonly',
};
const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  structuredClone: 'readonly',
  URL: 'readonly',
};

export default defineConfig(
  {
    ignores: ['dist/**', 'website/_site/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: browserGlobals,
    },
  },
  {
    // Cascades onto the shared rules above; extends is not repeated here.
    files: [
      'bin/**/*.{js,ts}',
      'scripts/**/*.{js,ts}',
      'src/**/*.{js,ts}',
      'website/**/*.{js,ts}',
      'eslint.config.mjs',
    ],
    ignores: ['website/assets/**'],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
);
