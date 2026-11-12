import assert from 'node:assert/strict';
import stylelint from 'stylelint';
import { generateCss } from '../src/generate.js';
import { getTokenIndex } from '../src/token-index.js';
import config from '../src/stylelint/config.js';

async function main() {
  generateCss();
  const { names } = getTokenIndex({ extended: true });
  assert.ok(names.has('text-primary'), 'expected text-primary in token index');

  // Wiring loads; valid-token is intentionally a no-op for now.
  for (const lintConfig of [
    config,
    { extends: ['@keithjgrant/argot/stylelint/config'] },
  ]) {
    const result = await stylelint.lint({
      code: 'a { color: var(--text-primry); --my-extra: 1rem; }\n',
      config: lintConfig,
    });
    assert.equal(result.errored, false);
    assert.equal(
      result.results[0].warnings.length,
      0,
      `expected no warnings from no-op rule, got ${JSON.stringify(result.results[0].warnings)}`,
    );
  }

  console.log('ok');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
