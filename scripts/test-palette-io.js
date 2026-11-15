import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  generatePaletteCss,
  normalizePaletteDefinition,
} from '@keithjgrant/argot/palette';
import {
  loadPaletteDefinition,
  writePalette,
} from '@keithjgrant/argot/palette/node';

const root = path.resolve(import.meta.dirname, '..');
const definition = {
  version: 1,
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
};

function workspace(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-palette-io-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

test('definition loader reads UTF-8 JSON and returns validated defaults', (t) => {
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

test('definition loader distinguishes read, JSON and schema errors with the input path', (t) => {
  const cwd = workspace(t);
  const input = path.join(cwd, 'palette.json');
  assert.throws(
    () => loadPaletteDefinition(input),
    (error) =>
      error.message.includes(input) && error.message.includes('ENOENT'),
  );
  fs.writeFileSync(input, '{ invalid json');
  assert.throws(
    () => loadPaletteDefinition(input),
    (error) =>
      error.message.includes(input) && error.message.startsWith('Invalid JSON'),
  );
  fs.writeFileSync(input, JSON.stringify({ ...definition, version: 2 }));
  assert.throws(
    () => loadPaletteDefinition(input),
    (error) =>
      error.message.includes(input) &&
      error.message.includes('definition.version'),
  );
  fs.writeFileSync(
    input,
    JSON.stringify({
      version: 1,
      colors: [{ name: 'brand', l: '60%', c: 0.2, h: 250 }],
    }),
  );
  assert.throws(
    () => loadPaletteDefinition(input),
    (error) =>
      error.message.includes(input) && error.message.includes('colors[0].l'),
  );
  assert.deepEqual(fs.readdirSync(cwd), ['palette.json']);
});

test('palette writer creates parent directories and returns the actual CSS and path', (t) => {
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

test('palette writer requires force to replace user-edited files', (t) => {
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

test('palette dry runs render without creating directories or modifying output', (t) => {
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
  const invalid = { version: 1, colors: [] };
  assert.throws(() => writePalette(output, invalid), /definition.colors/);
  assert.equal(fs.existsSync(path.dirname(output)), false);
  const existing = path.join(cwd, 'existing.css');
  fs.writeFileSync(existing, 'keep me');
  assert.throws(
    () => writePalette(existing, invalid, { force: true }),
    /definition.colors/,
  );
  assert.equal(fs.readFileSync(existing, 'utf8'), 'keep me');
});

test('palette writer refuses directory outputs, including forced dry runs', (t) => {
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

test('palette writer refuses existing and dangling final-path symlinks', (t) => {
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

for (const [mode, entrypoint] of [
  ['compiled', path.join(root, 'bin/argot.js')],
  ['native', path.join(root, 'scripts/dev.js')],
]) {
  function invoke(cwd, ...args) {
    const result = spawnSync(
      process.execPath,
      [entrypoint, 'palette', ...args],
      {
        cwd,
        encoding: 'utf8',
        timeout: 10000,
      },
    );
    assert.equal(result.error, undefined);
    return result;
  }

  function fails(result, message) {
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /^argot: /);
    assert.match(result.stderr, message);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
    assert.doesNotMatch(result.stdout, /Wrote /);
  }

  test(`${mode} palette CLI supports dry runs, default output and explicit replacement`, (t) => {
    const cwd = workspace(t);
    fs.writeFileSync(
      path.join(cwd, 'palette.json'),
      JSON.stringify(definition),
    );
    const preview = invoke(
      cwd,
      'palette.json',
      'nested/primitives.css',
      '--dry-run',
    );
    assert.equal(preview.status, 0, preview.stderr);
    assert.match(preview.stdout, /Would write/);
    assert.equal(fs.existsSync(path.join(cwd, 'nested')), false);
    const created = invoke(cwd, 'palette.json');
    assert.equal(created.status, 0, created.stderr);
    const output = path.join(cwd, 'primitives.css');
    assert.equal(
      fs.readFileSync(output, 'utf8'),
      generatePaletteCss(definition),
    );
    fs.writeFileSync(output, 'user edit');
    fails(invoke(cwd, 'palette.json'), /already exists/);
    fails(invoke(cwd, 'palette.json', '--dry-run'), /already exists/);
    const forcedPreview = invoke(cwd, 'palette.json', '--force', '--dry-run');
    assert.equal(forcedPreview.status, 0, forcedPreview.stderr);
    assert.equal(fs.readFileSync(output, 'utf8'), 'user edit');
    const forced = invoke(cwd, 'palette.json', '--force');
    assert.equal(forced.status, 0, forced.stderr);
    assert.equal(
      fs.readFileSync(output, 'utf8'),
      generatePaletteCss(definition),
    );
  });

  test(`${mode} palette CLI rejects invalid arguments and identical resolved paths`, (t) => {
    const cwd = workspace(t);
    const input = JSON.stringify(definition);
    fs.writeFileSync(path.join(cwd, 'palette.json'), input);
    for (const args of [
      [],
      ['palette.json', 'one.css', 'two.css'],
      ['palette.json', '--unknown'],
      ['palette.json', '--force=true'],
    ]) {
      fails(
        invoke(cwd, ...args),
        /Usage:|Unknown option|does not take an argument/i,
      );
    }
    for (const output of [
      'palette.json',
      './palette.json',
      'missing/../palette.json',
    ]) {
      fails(
        invoke(cwd, 'palette.json', output, '--force'),
        /paths must be different/,
      );
    }
    assert.equal(
      fs.readFileSync(path.join(cwd, 'palette.json'), 'utf8'),
      input,
    );
    assert.deepEqual(fs.readdirSync(cwd), ['palette.json']);
    const help = invoke(cwd, '--help');
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /Usage: argot palette/);
  });

  test(`${mode} palette CLI reports input errors without creating output`, (t) => {
    const cwd = workspace(t);
    const output = 'missing/primitives.css';
    fails(invoke(cwd, 'absent.json', output), /Cannot read.*ENOENT/);
    fs.writeFileSync(path.join(cwd, 'invalid.json'), '{ broken');
    fails(invoke(cwd, 'invalid.json', output), /Invalid JSON/);
    fs.writeFileSync(
      path.join(cwd, 'invalid.json'),
      '{"version":2,"colors":[]}',
    );
    fails(invoke(cwd, 'invalid.json', output), /definition.version/);
    assert.equal(fs.existsSync(path.join(cwd, 'missing')), false);
  });

  test(`${mode} palette CLI refuses directory and symlink output even with force`, (t) => {
    const cwd = workspace(t);
    fs.writeFileSync(
      path.join(cwd, 'palette.json'),
      JSON.stringify(definition),
    );
    fails(invoke(cwd, 'palette.json', cwd, '--force'), /non-regular file/);
    fs.writeFileSync(path.join(cwd, 'target.css'), 'keep target');
    fs.symlinkSync(path.join(cwd, 'target.css'), path.join(cwd, 'link.css'));
    fails(
      invoke(cwd, 'palette.json', 'link.css', '--force'),
      /non-regular file/,
    );
    assert.equal(
      fs.readFileSync(path.join(cwd, 'target.css'), 'utf8'),
      'keep target',
    );
  });
}
