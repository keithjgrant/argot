import { fileURLToPath } from 'node:url';
import type { Config } from 'stylelint';

/**
 * Shareable Stylelint config for Argot token usage.
 *
 * @example
 * // stylelint.config.js
 * export default {
 *   extends: ['@keithjgrant/argot/stylelint/config'],
 * };
 */
export default {
  plugins: [
    fileURLToPath(new URL(
      import.meta.url.endsWith('.ts') ? './index.ts' : './index.js',
      import.meta.url,
    )),
  ],
  rules: {
    'argot/valid-token': true,
  },
} satisfies Config;
