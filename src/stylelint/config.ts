import type { Config } from 'stylelint';
import { colorContrast } from './index.ts';

/**
 * Shareable Stylelint config for Argot token usage.
 *
 * @example
 * // stylelint.config.js
 * export default {
 *   extends: ['argot-css/stylelint/config'],
 * };
 */
export default {
  plugins: [colorContrast],
  rules: {
    'argot/color-contrast': true,
  },
} satisfies Config;
