import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import stylelint from 'stylelint';
import validToken from './valid-token.ts';

describe('argot/valid-token', () => {
  test('is a no-op that reports no warnings for unknown tokens', async () => {
    const result = await stylelint.lint({
      code: 'a { color: var(--text-primry); --my-extra: 1rem; }\n',
      config: {
        plugins: [validToken],
        rules: { 'argot/valid-token': true },
      },
    });
    assert.equal(result.errored, false);
    assert.equal(
      result.results[0].warnings.length,
      0,
      `expected no warnings from no-op rule, got ${JSON.stringify(result.results[0].warnings)}`,
    );
  });
});
