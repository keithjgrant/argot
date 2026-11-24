import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import stylelint from 'stylelint';
import config from './config.ts';

describe('config', () => {
  test('should enable the color-contrast rule', () => {
    assert.equal(config.rules['argot/color-contrast'], true);
  });
});

describe('integration', () => {
  test('should report no warnings when stylelint extends the published config', async () => {
    const result = await stylelint.lint({
      code: 'a { color: var(--text-primary); --my-extra: 1rem; }\n',
      config: { extends: ['argot-css/stylelint/config'] },
    });
    assert.equal(
      result.errored,
      false,
      `stylelint reported errors: ${JSON.stringify(result.results[0]?.warnings ?? [], null, 2)}`,
    );
    assert.equal(
      result.results[0].warnings.length,
      0,
      `expected no warnings, got ${JSON.stringify(result.results[0].warnings)}`,
    );
  });

  test('should report no warnings when stylelint uses the local config export', async () => {
    const result = await stylelint.lint({
      code: 'a { color: var(--text-primary); --my-extra: 1rem; }\n',
      config,
    });
    assert.equal(
      result.errored,
      false,
      `stylelint reported errors: ${JSON.stringify(result.results[0]?.warnings ?? [], null, 2)}`,
    );
    assert.equal(result.results[0].warnings.length, 0);
  });
});
