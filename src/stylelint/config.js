import { fileURLToPath } from 'node:url';

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
  plugins: [fileURLToPath(new URL('./index.js', import.meta.url))],
  rules: {
    'argot/valid-token': true,
  },
};
