import { describe, test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePaletteDefinition } from './definition.ts';
import { generatePaletteCss } from './render.ts';
import { loadPaletteDefinition, writePalette } from './node.ts';
import type { PaletteDefinition } from './types.ts';

const definition: PaletteDefinition = {
  version: 1,
  seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
};

function workspace(t: TestContext): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-palette-io-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

describe('loadPaletteDefinition', () => {
  test('sample JSON loads numeric seeds directly', () => {
    const input = loadPaletteDefinition(
      fileURLToPath(
        new URL('../../scripts/fixtures/palette.json', import.meta.url),
      ),
    );
    assert.deepEqual(input.seedColors, [
      { name: 'gray', l: 0.6, c: 0.015, h: 250 },
      { name: 'brand', l: 0.6, c: 0.2, h: 250 },
    ]);
  });

  test('reads UTF-8 JSON and returns validated defaults', (t) => {
    const cwd = workspace(t);
    const input = path.join(cwd, 'palette.json');
    fs.writeFileSync(input, JSON.stringify(definition));
    assert.deepEqual(
      loadPaletteDefinition(input),
      normalizePaletteDefinition(definition),
    );
    assert.deepEqual(
      loadPaletteDefinition(path.relative(process.cwd(), input)),
      normalizePaletteDefinition(definition),
    );
    assert.equal(fs.readFileSync(input, 'utf8'), JSON.stringify(definition));
  });

  test('distinguishes read, JSON and schema errors with the input path', (t) => {
    const cwd = workspace(t);
    const input = path.join(cwd, 'palette.json');
    assert.throws(
      () => loadPaletteDefinition(input),
      (error: Error) =>
        error.message.includes(input) && error.message.includes('ENOENT'),
    );
    fs.writeFileSync(input, '{ invalid json');
    assert.throws(
      () => loadPaletteDefinition(input),
      (error: Error) =>
        error.message.includes(input) &&
        error.message.startsWith('Invalid JSON'),
    );
    fs.writeFileSync(input, JSON.stringify({ ...definition, version: 2 }));
    assert.throws(
      () => loadPaletteDefinition(input),
      (error: Error) =>
        error.message.includes(input) &&
        error.message.includes('definition.version'),
    );
    fs.writeFileSync(
      input,
      JSON.stringify({
        version: 1,
        seedColors: [{ name: 'brand', l: '60%', c: 0.2, h: 250 }],
      }),
    );
    assert.throws(
      () => loadPaletteDefinition(input),
      (error: Error) =>
        error.message.includes(input) &&
        error.message.includes('seedColors[0].l'),
    );
    assert.deepEqual(fs.readdirSync(cwd), ['palette.json']);
  });
});

describe('writePalette', () => {
  test('creates parent directories and returns the actual CSS and path', (t) => {
    const cwd = workspace(t);
    const output = path.join(cwd, 'styles/tokens/primitives.css');
    const result = writePalette(output, definition);
    assert.deepEqual(result, {
      path: path.resolve(output),
      css: generatePaletteCss(definition),
      written: true,
    });
    assert.equal(fs.readFileSync(output, 'utf8'), result.css);
  });

  test('requires force to replace user-edited files', (t) => {
    const cwd = workspace(t);
    const output = path.join(cwd, 'primitives.css');
    const other = path.join(cwd, 'other.css');
    fs.writeFileSync(output, 'user-edited CSS');
    fs.writeFileSync(other, 'unrelated CSS');
    assert.throws(
      () => writePalette(output, definition),
      /already exists.*--force/,
    );
    assert.equal(fs.readFileSync(output, 'utf8'), 'user-edited CSS');
    const result = writePalette(output, definition, { force: true });
    assert.equal(result.written, true);
    assert.equal(fs.readFileSync(output, 'utf8'), result.css);
    assert.equal(fs.readFileSync(other, 'utf8'), 'unrelated CSS');
  });

  test('dry runs render without creating directories or modifying output', (t) => {
    const cwd = workspace(t);
    const output = path.join(cwd, 'missing/parent/primitives.css');
    const result = writePalette(output, definition, { dryRun: true });
    assert.deepEqual(result, {
      path: path.resolve(output),
      css: generatePaletteCss(definition),
      written: false,
    });
    assert.equal(fs.existsSync(path.join(cwd, 'missing')), false);
    const existing = path.join(cwd, 'existing.css');
    fs.writeFileSync(existing, 'keep me');
    assert.throws(
      () => writePalette(existing, definition, { dryRun: true }),
      /already exists/,
    );
    const replacement = writePalette(existing, definition, {
      dryRun: true,
      force: true,
    });
    assert.equal(replacement.written, false);
    assert.equal(replacement.css, result.css);
    assert.equal(fs.readFileSync(existing, 'utf8'), 'keep me');
  });

  test('invalid definitions fail before any output directory or file changes', (t) => {
    const cwd = workspace(t);
    const output = path.join(cwd, 'missing/primitives.css');
    const invalid = { version: 1 as const, seedColors: [] };
    assert.throws(() => writePalette(output, invalid), /definition.seedColors/);
    assert.equal(fs.existsSync(path.dirname(output)), false);
    const existing = path.join(cwd, 'existing.css');
    fs.writeFileSync(existing, 'keep me');
    assert.throws(
      () => writePalette(existing, invalid, { force: true }),
      /definition.seedColors/,
    );
    assert.equal(fs.readFileSync(existing, 'utf8'), 'keep me');
  });

  test('refuses directory outputs, including forced dry runs', (t) => {
    const cwd = workspace(t);
    for (const force of [false, true]) {
      for (const dryRun of [false, true]) {
        assert.throws(
          () => writePalette(cwd, definition, { force, dryRun }),
          /non-regular file/,
        );
      }
    }
    assert.deepEqual(fs.readdirSync(cwd), []);
  });

  test('refuses existing and dangling final-path symlinks', (t) => {
    const cwd = workspace(t);
    const target = path.join(cwd, 'target.css');
    fs.writeFileSync(target, 'keep target');
    for (const name of ['target.css', 'missing.css']) {
      const link = path.join(cwd, `link-${name}`);
      const destination = path.join(cwd, name);
      fs.symlinkSync(destination, link);
      for (const force of [false, true]) {
        for (const dryRun of [false, true]) {
          assert.throws(
            () => writePalette(link, definition, { force, dryRun }),
            /non-regular file/,
          );
        }
      }
      assert.equal(fs.readlinkSync(link), destination);
    }
    assert.equal(fs.readFileSync(target, 'utf8'), 'keep target');
    assert.equal(fs.existsSync(path.join(cwd, 'missing.css')), false);
  });
});

describe('integration', () => {
  test('sample JSON generates primitive CSS', () => {
    const input = loadPaletteDefinition(
      fileURLToPath(
        new URL('../../scripts/fixtures/palette.json', import.meta.url),
      ),
    );
    assert.match(generatePaletteCss(input), /--gray-16:/);
    assert.match(generatePaletteCss(input), /--brand-16:/);
  });
});
