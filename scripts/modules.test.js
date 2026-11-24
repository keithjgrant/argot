/**
 * Package-entrypoint checks against the in-repo package, not src/ unit tests.
 *
 * Imports of `argot-css/...` use Node's package self-resolution: they
 * follow this package's `exports` map into compiled `dist/` the same way a
 * consumer would after install. The native TypeScript cases import `src/`
 * directly and compare that output to the compiled entrypoints, and exercise
 * `scripts/devCli.js` without requiring a separate install.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { generateCss, renderCss, writeTemplate } from 'argot-css/semantics';
import { generatePalette } from 'argot-css/palette';
import { colorContrast } from 'argot-css/stylelint';
import config from 'argot-css/stylelint/config';

const root = path.resolve(import.meta.dirname, '..');
const devCli = path.join(root, 'scripts/devCli.js');

const paletteInput = {
  version: 1,
  seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
  options: { lightnessCurve: 'centered', chromaCurve: 'weighted' },
};

describe('public package entrypoints', () => {
  test('should expose generate helpers', () => {
    assert.equal(typeof generateCss, 'function');
    assert.equal(typeof renderCss, 'function');
    assert.equal(typeof writeTemplate, 'function');
  });

  test('should expose the color-contrast stylelint plugin', () => {
    assert.equal(colorContrast.ruleName, 'argot/color-contrast');
  });

  test('should enable color-contrast in the published config', () => {
    assert.equal(config.rules['argot/color-contrast'], true);
  });
});

describe('native TypeScript development entrypoints', () => {
  test('should match compiled generateCss', async () => {
    const { generateCss: nativeCss } =
      await import('../src/semantics/generate.ts');
    assert.equal(nativeCss(), generateCss());
  });

  test('should match compiled generatePalette', async () => {
    const { generatePalette: nativePalette } =
      await import('../src/palette/index.ts');
    assert.deepEqual(
      nativePalette(paletteInput),
      generatePalette(paletteInput),
    );
  });

  test('should generate semantics.css via the dev CLI', (t) => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-native-'));
    t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
    execFileSync(process.execPath, [devCli, 'semantics', 'semantics.css'], {
      cwd,
    });
    assert.equal(
      fs.readFileSync(path.join(cwd, 'semantics.css'), 'utf8'),
      generateCss(),
    );
  });

  test('should generate palette CSS via the dev CLI', (t) => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-native-'));
    t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
    fs.writeFileSync(
      path.join(cwd, 'palette.json'),
      JSON.stringify(paletteInput),
    );
    execFileSync(process.execPath, [devCli, 'palette', 'palette.json'], {
      cwd,
    });
    assert.match(
      fs.readFileSync(path.join(cwd, 'primitives.css'), 'utf8'),
      /--brand-16:/,
    );
  });
});
