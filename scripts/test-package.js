import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');

function workspace(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-distribution-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function linkDependency(cwd, name) {
  const destination = path.join(cwd, 'node_modules', name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.symlinkSync(path.join(root, 'node_modules', name), destination, 'dir');
}

test('packed package runs as JavaScript and exposes standalone declarations', () => {
  // Use a private workspace and local dependencies: no registry, publishing, or
  // reliance on source files being adjacent to dist in the package under test.
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-packed-'));
  try {
    const output = execFileSync('npm', [
      'pack', '--json', '--pack-destination', cwd,
    ], { cwd: root, encoding: 'utf8' });
    const [packed] = JSON.parse(output.slice(output.indexOf('[')));
    const files = packed.files.map(({ path: filename }) => filename);
    assert.ok(files.includes('dist/palette/index.js'));
    assert.ok(files.includes('dist/palette/index.d.ts'));
    assert.ok(files.includes('dist/load-tokens.js'));
    assert.ok(files.includes('tokens/color-text.json'));
    assert.ok(files.includes('templates/semantics.css'));
    assert.ok(files.includes('docs/api.md'));
    assert.deepEqual(files.filter((file) => file.startsWith('docs/')), ['docs/api.md']);
    assert.ok(files.every((file) => !file.startsWith('src/') && !file.startsWith('website/')));
    assert.ok(files.every((file) => !file.endsWith('.ts') || file.endsWith('.d.ts')));
    const installed = path.join(cwd, 'node_modules/@keithjgrant/argot');
    fs.mkdirSync(installed, { recursive: true });
    execFileSync('tar', [
      '-xzf', path.join(cwd, packed.filename),
      '-C', installed, '--strip-components=1',
    ]);
    fs.writeFileSync(path.join(cwd, 'package.json'), '{"type":"module"}');
    const apiReference = fs.readFileSync(path.join(installed, 'docs/api.md'), 'utf8');
    for (const entrypoint of [
      '@keithjgrant/argot/palette',
      '@keithjgrant/argot/palette/node',
      '@keithjgrant/argot/generate',
      '@keithjgrant/argot/stylelint',
      '@keithjgrant/argot/stylelint/config',
    ]) {
      assert.ok(apiReference.includes(entrypoint), `Missing API reference: ${entrypoint}`);
    }
    for (const dependency of ['colorjs.io', 'stylelint', '@types']) {
      linkDependency(cwd, dependency);
    }
    fs.writeFileSync(path.join(cwd, 'smoke.js'), `
import assert from 'node:assert/strict';
import stylelint from 'stylelint';
import { generateCss } from '@keithjgrant/argot/generate';
import {
  generatePalette, generatePaletteCss, parseCssColor, serializePaletteDefinition,
} from '@keithjgrant/argot/palette';
import { loadPaletteDefinition, writePalette } from '@keithjgrant/argot/palette/node';
import plugins from '@keithjgrant/argot/stylelint';
import config from '@keithjgrant/argot/stylelint/config';
const definition = { version: 1, colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }] };
assert.deepEqual(parseCssColor('oklch(60% 0.2 250)'), { l: 0.6, c: 0.2, h: 250 });
const palette = generatePalette(definition);
assert.equal(palette.colors[0].steps.length, 16);
assert.match(generatePaletteCss(definition), /--brand-16:/);
assert.match(generateCss(), /--text-primary:/);
assert.equal(plugins[0].ruleName, 'argot/valid-token');
const result = writePalette('palette.css', definition);
assert.equal(result.written, true);
const fs = await import('node:fs');
fs.writeFileSync('palette.json', serializePaletteDefinition(definition));
assert.equal(loadPaletteDefinition('palette.json').version, 1);
const lint = await stylelint.lint({
  code: 'a { color: var(--text-primary); }',
  config: { extends: ['@keithjgrant/argot/stylelint/config'] },
  cwd: process.cwd(),
});
assert.equal(lint.errored, false);
assert.ok(config.plugins[0].endsWith('/dist/stylelint/index.js'));
`);
    execFileSync(process.execPath, ['--no-experimental-strip-types', 'smoke.js'], {
      cwd, stdio: 'pipe',
    });
    execFileSync(process.execPath, [
      '--no-experimental-strip-types',
      path.join(installed, 'bin/argot.js'), 'generate', 'semantics.css',
    ], { cwd, stdio: 'pipe' });
    execFileSync(process.execPath, [
      '--no-experimental-strip-types',
      path.join(installed, 'bin/argot.js'), 'palette', 'palette.json', 'cli-palette.css',
    ], { cwd, stdio: 'pipe' });
    assert.match(fs.readFileSync(path.join(cwd, 'semantics.css'), 'utf8'), /--text-primary:/);
    assert.match(fs.readFileSync(path.join(cwd, 'cli-palette.css'), 'utf8'), /--brand-16:/);
    for (const file of ['consumer.ts', 'tsconfig.json', 'browser.ts', 'tsconfig.browser.json']) {
      fs.copyFileSync(path.join(root, 'scripts/types', file), path.join(cwd, file));
    }
    const compiler = path.join(
      path.dirname(fileURLToPath(import.meta.resolve('typescript/package.json'))),
      'bin/tsc',
    );
    execFileSync(process.execPath, [compiler, '--project', 'tsconfig.json'], {
      cwd, stdio: 'pipe',
    });
    execFileSync(process.execPath, [compiler, '--project', 'tsconfig.browser.json'], {
      cwd, stdio: 'pipe',
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('native development commands work with no dist directory', (t) => {
  const cwd = workspace(t);
  for (const directory of ['src', 'tokens']) {
    fs.cpSync(path.join(root, directory), path.join(cwd, directory), { recursive: true });
  }
  fs.mkdirSync(path.join(cwd, 'scripts'));
  fs.copyFileSync(path.join(root, 'scripts/dev.js'), path.join(cwd, 'scripts/dev.js'));
  fs.writeFileSync(path.join(cwd, 'package.json'), '{"type":"module"}');
  linkDependency(cwd, 'colorjs.io');
  execFileSync(process.execPath, ['scripts/dev.js', 'generate', 'semantics.css'], {
    cwd, stdio: 'pipe',
  });
  fs.writeFileSync(path.join(cwd, 'palette.json'), JSON.stringify({
    version: 1, colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
  }));
  execFileSync(process.execPath, ['scripts/dev.js', 'palette', 'palette.json'], {
    cwd, stdio: 'pipe',
  });
  assert.equal(fs.existsSync(path.join(cwd, 'dist')), false);
  assert.match(fs.readFileSync(path.join(cwd, 'semantics.css'), 'utf8'), /--text-primary:/);
  assert.match(fs.readFileSync(path.join(cwd, 'primitives.css'), 'utf8'), /--brand-16:/);
});
