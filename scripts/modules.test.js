import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  generateCss,
  renderCss,
  writeTemplate,
} from '@keithjgrant/argot/generate';
import { generatePalette } from '@keithjgrant/argot/palette';
import plugins from '@keithjgrant/argot/stylelint';
import config from '@keithjgrant/argot/stylelint/config';

const root = path.resolve(import.meta.dirname, '..');
const devCli = path.join(root, 'scripts/dev.js');

describe('public package entrypoints', () => {
  test('should expose native ESM exports', () => {
    assert.equal(typeof generateCss, 'function');
    assert.equal(typeof renderCss, 'function');
    assert.equal(typeof writeTemplate, 'function');
    assert.equal(plugins[0].ruleName, 'argot/valid-token');
    assert.equal(config.rules['argot/valid-token'], true);
  });
});

describe('native TypeScript development entrypoints', () => {
  test('should match compiled output', async (t) => {
    const { generateCss: nativeCss } = await import('../src/generate.ts');
    const { generatePalette: nativePalette } =
      await import('../src/palette/index.ts');
    const input = {
      version: 1,
      seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
      options: { lightnessCurve: 'centered', chromaCurve: 'weighted' },
    };
    assert.equal(nativeCss(), generateCss());
    assert.deepEqual(nativePalette(input), generatePalette(input));
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-native-'));
    t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
    execFileSync(process.execPath, [devCli, 'generate', 'semantics.css'], {
      cwd,
    });
    assert.equal(
      fs.readFileSync(path.join(cwd, 'semantics.css'), 'utf8'),
      generateCss(),
    );
    fs.writeFileSync(path.join(cwd, 'palette.json'), JSON.stringify(input));
    execFileSync(process.execPath, [devCli, 'palette', 'palette.json'], {
      cwd,
    });
    assert.match(
      fs.readFileSync(path.join(cwd, 'primitives.css'), 'utf8'),
      /--brand-16:/,
    );
  });
});
