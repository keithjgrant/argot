import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  generateCss,
  renderCss,
  writeTemplate,
} from '@keithjgrant/argot/generate';
import plugins from '@keithjgrant/argot/stylelint';
import config from '@keithjgrant/argot/stylelint/config';

const root = path.resolve(import.meta.dirname, '..');
const cli = path.join(root, 'bin/argot.js');
const devCli = path.join(root, 'scripts/dev.js');

test('public package entrypoints expose native ESM exports', () => {
  assert.equal(typeof generateCss, 'function');
  assert.equal(typeof renderCss, 'function');
  assert.equal(typeof writeTemplate, 'function');
  assert.equal(plugins[0].ruleName, 'argot/valid-token');
  assert.equal(config.rules['argot/valid-token'], true);
});

test('checked-in CSS templates match the current token definitions', () => {
  for (const extended of [false, true]) {
    const file = extended ? 'semantics-extended.css' : 'semantics.css';
    assert.equal(
      generateCss({ extended }),
      fs.readFileSync(path.join(root, 'templates', file), 'utf8'),
    );
  }
});

test('CLI generates identical core and extended templates outside the package', (t) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-esm-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  for (const extended of [false, true]) {
    const filename = extended ? 'extended.css' : 'core.css';
    execFileSync(
      process.execPath,
      [cli, 'generate', filename, ...(extended ? ['--extended'] : [])],
      { cwd },
    );
    assert.equal(
      fs.readFileSync(path.join(cwd, filename), 'utf8'),
      generateCss({ extended }),
    );
  }
});

test('CLI help and error handling still work', () => {
  const help = execFileSync(process.execPath, [cli, '--help'], {
    encoding: 'utf8',
  });
  assert.match(help, /Usage:/);
  const unknown = spawnSync(process.execPath, [cli, 'unknown'], {
    encoding: 'utf8',
  });
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown command/);
});

test('native TypeScript development entrypoints match compiled output', async (t) => {
  const { generateCss: nativeCss } = await import('../src/generate.ts');
  const { generatePalette: nativePalette } = await import('../src/palette/index.ts');
  const { generatePalette } = await import('@keithjgrant/argot/palette');
  const input = {
    version: 1,
    colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
    options: { lightnessCurve: 'centered', chromaCurve: 'weighted' },
  };
  assert.equal(nativeCss(), generateCss());
  assert.deepEqual(nativePalette(input), generatePalette(input));
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-native-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  execFileSync(process.execPath, [devCli, 'generate', 'semantics.css'], { cwd });
  assert.equal(fs.readFileSync(path.join(cwd, 'semantics.css'), 'utf8'), generateCss());
  fs.writeFileSync(path.join(cwd, 'palette.json'), JSON.stringify(input));
  execFileSync(process.execPath, [devCli, 'palette', 'palette.json'], { cwd });
  assert.match(fs.readFileSync(path.join(cwd, 'primitives.css'), 'utf8'), /--brand-16:/);
});
