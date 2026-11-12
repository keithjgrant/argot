/**
 * Shareable Stylelint config for Argot token usage.
 *
 * @example
 * // stylelint.config.js
 * module.exports = {
 *   extends: ['@keithjgrant/argot/stylelint/config'],
 * };
 */
module.exports = {
  plugins: [require.resolve('./index.js')],
  rules: {
    'argot/valid-token': true,
  },
};
