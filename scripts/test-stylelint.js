const assert = require('assert');
const stylelint = require('stylelint');
const { generateCss } = require('../src/generate');
const { getTokenIndex } = require('../src/token-index');

async function main() {
  generateCss();
  const { names } = getTokenIndex({ extended: true });
  assert.ok(names.has('text-primary'), 'expected text-primary in token index');

  const config = require('../src/stylelint/config');

  // Wiring loads; valid-token is intentionally a no-op for now.
  const result = await stylelint.lint({
    code: 'a { color: var(--text-primry); --my-extra: 1rem; }\n',
    config,
  });
  assert.equal(
    result.results[0].warnings.length,
    0,
    `expected no warnings from no-op rule, got ${JSON.stringify(result.results[0].warnings)}`
  );

  console.log('ok');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
