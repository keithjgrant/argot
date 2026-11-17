import { describe, test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePaletteDefinition } from './validation.ts';
import { generatePaletteCss } from './render.ts';
import { loadPaletteDefinition, writePalette } from './node.ts';
import type { PaletteDefinition } from './types.ts';

const definition: PaletteDefinition = {
  version: 1,
  seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
};

const samplePath = fileURLToPath(
  new URL('../../scripts/fixtures/palette.json', import.meta.url),
);

function workspace(t: TestContext): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-palette-io-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

describe('loadPaletteDefinition', () => {
  test('should load numeric seeds directly from sample JSON', () => {
    assert.deepEqual(loadPaletteDefinition(samplePath).seedColors, [
      { name: 'gray', l: 0.6, c: 0.015, h: 250 },
      { name: 'brand', l: 0.6, c: 0.2, h: 250 },
    ]);
  });

  test('should return validated defaults for absolute paths', (t) => {
    const input = path.join(workspace(t), 'palette.json');
    fs.writeFileSync(input, JSON.stringify(definition));
    assert.deepEqual(
      loadPaletteDefinition(input),
      normalizePaletteDefinition(definition),
    );
  });

  test('should resolve relative paths', (t) => {
    const input = path.join(workspace(t), 'palette.json');
    fs.writeFileSync(input, JSON.stringify(definition));
    assert.deepEqual(
      loadPaletteDefinition(path.relative(process.cwd(), input)),
      normalizePaletteDefinition(definition),
    );
  });

  test('should leave the input file unchanged', (t) => {
    const input = path.join(workspace(t), 'palette.json');
    const source = JSON.stringify(definition);
    fs.writeFileSync(input, source);
    loadPaletteDefinition(input);
    assert.equal(fs.readFileSync(input, 'utf8'), source);
  });

  test('should include the input path in ENOENT errors', (t) => {
    const input = path.join(workspace(t), 'palette.json');
    assert.throws(
      () => loadPaletteDefinition(input),
      (error: Error) =>
        error.message.includes(input) && error.message.includes('ENOENT'),
    );
  });

  test('should include the input path in Invalid JSON errors', (t) => {
    const input = path.join(workspace(t), 'palette.json');
    fs.writeFileSync(input, '{ invalid json');
    assert.throws(
      () => loadPaletteDefinition(input),
      (error: Error) =>
        error.message.includes(input) &&
        error.message.startsWith('Invalid JSON'),
    );
  });

  test('should include the input path in schema version errors', (t) => {
    const input = path.join(workspace(t), 'palette.json');
    fs.writeFileSync(input, JSON.stringify({ ...definition, version: 2 }));
    assert.throws(
      () => loadPaletteDefinition(input),
      (error: Error) =>
        error.message.includes(input) &&
        error.message.includes('definition.version'),
    );
  });

  test('should include the input path in seed validation errors', (t) => {
    const cwd = workspace(t);
    const input = path.join(cwd, 'palette.json');
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
  test('should create parent directories', (t) => {
    const output = path.join(workspace(t), 'styles/tokens/primitives.css');
    writePalette(output, definition);
    assert.equal(fs.existsSync(path.dirname(output)), true);
  });

  test('should return the resolved path, css, and written true', (t) => {
    const output = path.join(workspace(t), 'styles/tokens/primitives.css');
    assert.deepEqual(writePalette(output, definition), {
      path: path.resolve(output),
      css: generatePaletteCss(definition),
      written: true,
    });
  });

  test('should write the generated CSS to disk', (t) => {
    const output = path.join(workspace(t), 'styles/tokens/primitives.css');
    const result = writePalette(output, definition);
    assert.equal(fs.readFileSync(output, 'utf8'), result.css);
  });

  test('should refuse to replace an existing file without force', (t) => {
    const output = path.join(workspace(t), 'primitives.css');
    fs.writeFileSync(output, 'user-edited CSS');
    assert.throws(
      () => writePalette(output, definition),
      /already exists.*--force/,
    );
  });

  test('should leave an existing file unchanged when refusing', (t) => {
    const output = path.join(workspace(t), 'primitives.css');
    fs.writeFileSync(output, 'user-edited CSS');
    assert.throws(() => writePalette(output, definition), /already exists/);
    assert.equal(fs.readFileSync(output, 'utf8'), 'user-edited CSS');
  });

  test('should replace an existing file with force', (t) => {
    const output = path.join(workspace(t), 'primitives.css');
    fs.writeFileSync(output, 'user-edited CSS');
    const result = writePalette(output, definition, { force: true });
    assert.equal(result.written, true);
    assert.equal(fs.readFileSync(output, 'utf8'), result.css);
  });

  test('should leave sibling files unchanged when forcing', (t) => {
    const cwd = workspace(t);
    const output = path.join(cwd, 'primitives.css');
    const other = path.join(cwd, 'other.css');
    fs.writeFileSync(output, 'user-edited CSS');
    fs.writeFileSync(other, 'unrelated CSS');
    writePalette(output, definition, { force: true });
    assert.equal(fs.readFileSync(other, 'utf8'), 'unrelated CSS');
  });

  test('should dry-run without creating directories', (t) => {
    const cwd = workspace(t);
    const output = path.join(cwd, 'missing/parent/primitives.css');
    const result = writePalette(output, definition, { dryRun: true });
    assert.deepEqual(result, {
      path: path.resolve(output),
      css: generatePaletteCss(definition),
      written: false,
    });
    assert.equal(fs.existsSync(path.join(cwd, 'missing')), false);
  });

  test('should refuse dry-run overwrite without force', (t) => {
    const existing = path.join(workspace(t), 'existing.css');
    fs.writeFileSync(existing, 'keep me');
    assert.throws(
      () => writePalette(existing, definition, { dryRun: true }),
      /already exists/,
    );
  });

  test('should dry-run force without modifying existing output', (t) => {
    const existing = path.join(workspace(t), 'existing.css');
    fs.writeFileSync(existing, 'keep me');
    const replacement = writePalette(existing, definition, {
      dryRun: true,
      force: true,
    });
    assert.equal(replacement.written, false);
    assert.equal(replacement.css, generatePaletteCss(definition));
    assert.equal(fs.readFileSync(existing, 'utf8'), 'keep me');
  });

  test('should fail invalid definitions before creating output directories', (t) => {
    const output = path.join(workspace(t), 'missing/primitives.css');
    assert.throws(
      () => writePalette(output, { version: 1, seedColors: [] }),
      /definition.seedColors/,
    );
    assert.equal(fs.existsSync(path.dirname(output)), false);
  });

  test('should fail invalid definitions before modifying existing files even with force', (t) => {
    const existing = path.join(workspace(t), 'existing.css');
    fs.writeFileSync(existing, 'keep me');
    assert.throws(
      () =>
        writePalette(existing, { version: 1, seedColors: [] }, { force: true }),
      /definition.seedColors/,
    );
    assert.equal(fs.readFileSync(existing, 'utf8'), 'keep me');
  });

  test('should refuse directory outputs regardless of force and dry-run', (t) => {
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

  test('should refuse existing symlink outputs', (t) => {
    const cwd = workspace(t);
    const target = path.join(cwd, 'target.css');
    const link = path.join(cwd, 'link-target.css');
    fs.writeFileSync(target, 'keep target');
    fs.symlinkSync(target, link);
    for (const force of [false, true]) {
      for (const dryRun of [false, true]) {
        assert.throws(
          () => writePalette(link, definition, { force, dryRun }),
          /non-regular file/,
        );
      }
    }
    assert.equal(fs.readlinkSync(link), target);
    assert.equal(fs.readFileSync(target, 'utf8'), 'keep target');
  });

  test('should refuse dangling symlink outputs', (t) => {
    const cwd = workspace(t);
    const destination = path.join(cwd, 'missing.css');
    const link = path.join(cwd, 'link-missing.css');
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
    assert.equal(fs.existsSync(destination), false);
  });
});

describe('integration', () => {
  test('should generate primitive CSS from sample JSON', () => {
    const css = generatePaletteCss(loadPaletteDefinition(samplePath));
    assert.match(css, /--gray-16:/);
    assert.match(css, /--brand-16:/);
  });
});
