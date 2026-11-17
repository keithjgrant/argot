import { describe, test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { generatePaletteCss } from './render.ts';
import type { PaletteDefinition } from './types.ts';

const root = path.resolve(import.meta.dirname, '../..');
const definition: PaletteDefinition = {
  version: 1,
  seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
};

function workspace(t: TestContext): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-palette-cli-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

for (const [mode, entrypoint] of [
  ['compiled', path.join(root, 'bin/argot.js')],
  ['native', path.join(root, 'scripts/dev.js')],
] as const) {
  function invoke(cwd: string, ...args: string[]) {
    const result = spawnSync(
      process.execPath,
      [entrypoint, 'palette', ...args],
      {
        cwd,
        encoding: 'utf8' as const,
        timeout: 10000,
      },
    );
    assert.equal(result.error, undefined);
    return result;
  }

  function fails(
    result: {
      status: number | null;
      stdout: string;
      stderr: string;
    },
    message: RegExp,
  ): void {
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /^argot: /);
    assert.match(result.stderr, message);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
    assert.doesNotMatch(result.stdout, /Wrote /);
  }

  function withDefinition(t: TestContext): string {
    const cwd = workspace(t);
    fs.writeFileSync(
      path.join(cwd, 'palette.json'),
      JSON.stringify(definition),
    );
    return cwd;
  }

  describe(`${mode} CLI`, () => {
    describe('--dry-run', () => {
      test('should not create output directories', (t) => {
        const cwd = withDefinition(t);
        const preview = invoke(
          cwd,
          'palette.json',
          'nested/primitives.css',
          '--dry-run',
        );
        assert.equal(preview.status, 0, preview.stderr);
        assert.match(preview.stdout, /Would write/);
        assert.equal(fs.existsSync(path.join(cwd, 'nested')), false);
      });

      test('should refuse overwrite of an existing file', (t) => {
        const cwd = withDefinition(t);
        fs.writeFileSync(path.join(cwd, 'primitives.css'), 'user edit');
        fails(invoke(cwd, 'palette.json', '--dry-run'), /already exists/);
      });

      test('should not modify existing output when combined with --force', (t) => {
        const cwd = withDefinition(t);
        const output = path.join(cwd, 'primitives.css');
        fs.writeFileSync(output, 'user edit');
        const forcedPreview = invoke(
          cwd,
          'palette.json',
          '--force',
          '--dry-run',
        );
        assert.equal(forcedPreview.status, 0, forcedPreview.stderr);
        assert.equal(fs.readFileSync(output, 'utf8'), 'user edit');
      });
    });

    describe('default output', () => {
      test('should write primitives.css from palette.json', (t) => {
        const cwd = withDefinition(t);
        const created = invoke(cwd, 'palette.json');
        assert.equal(created.status, 0, created.stderr);
        assert.equal(
          fs.readFileSync(path.join(cwd, 'primitives.css'), 'utf8'),
          generatePaletteCss(definition),
        );
      });

      test('should refuse to overwrite an existing file', (t) => {
        const cwd = withDefinition(t);
        const output = path.join(cwd, 'primitives.css');
        fs.writeFileSync(output, 'user edit');
        fails(invoke(cwd, 'palette.json'), /already exists/);
        assert.equal(fs.readFileSync(output, 'utf8'), 'user edit');
      });
    });

    describe('--force', () => {
      test('should replace an existing file', (t) => {
        const cwd = withDefinition(t);
        const output = path.join(cwd, 'primitives.css');
        fs.writeFileSync(output, 'user edit');
        const forced = invoke(cwd, 'palette.json', '--force');
        assert.equal(forced.status, 0, forced.stderr);
        assert.equal(
          fs.readFileSync(output, 'utf8'),
          generatePaletteCss(definition),
        );
      });
    });

    describe('arguments', () => {
      test('should reject missing arguments', (t) => {
        fails(invoke(workspace(t)), /Usage:/i);
      });

      test('should reject too many positional arguments', (t) => {
        const cwd = withDefinition(t);
        fails(invoke(cwd, 'palette.json', 'one.css', 'two.css'), /Usage:/i);
      });

      test('should reject unknown options', (t) => {
        const cwd = withDefinition(t);
        fails(invoke(cwd, 'palette.json', '--unknown'), /Unknown option/i);
      });

      test('should reject --force with a value', (t) => {
        const cwd = withDefinition(t);
        fails(
          invoke(cwd, 'palette.json', '--force=true'),
          /does not take an argument/i,
        );
      });

      test('should reject identical input and output paths', (t) => {
        const cwd = withDefinition(t);
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
      });

      test('should leave the input unchanged when rejecting paths', (t) => {
        const cwd = withDefinition(t);
        const input = JSON.stringify(definition);
        fails(
          invoke(cwd, 'palette.json', 'palette.json', '--force'),
          /paths must be different/,
        );
        assert.equal(
          fs.readFileSync(path.join(cwd, 'palette.json'), 'utf8'),
          input,
        );
        assert.deepEqual(fs.readdirSync(cwd), ['palette.json']);
      });

      test('should print usage for --help', (t) => {
        const help = invoke(workspace(t), '--help');
        assert.equal(help.status, 0, help.stderr);
        assert.match(help.stdout, /Usage: argot palette/);
      });
    });

    describe('input errors', () => {
      test('should report missing input without creating output', (t) => {
        const cwd = workspace(t);
        fails(
          invoke(cwd, 'absent.json', 'missing/primitives.css'),
          /Cannot read.*ENOENT/,
        );
        assert.equal(fs.existsSync(path.join(cwd, 'missing')), false);
      });

      test('should report invalid JSON without creating output', (t) => {
        const cwd = workspace(t);
        fs.writeFileSync(path.join(cwd, 'invalid.json'), '{ broken');
        fails(
          invoke(cwd, 'invalid.json', 'missing/primitives.css'),
          /Invalid JSON/,
        );
        assert.equal(fs.existsSync(path.join(cwd, 'missing')), false);
      });

      test('should report schema errors without creating output', (t) => {
        const cwd = workspace(t);
        fs.writeFileSync(
          path.join(cwd, 'invalid.json'),
          '{"version":2,"seedColors":[]}',
        );
        fails(
          invoke(cwd, 'invalid.json', 'missing/primitives.css'),
          /definition.version/,
        );
        assert.equal(fs.existsSync(path.join(cwd, 'missing')), false);
      });
    });

    describe('non-regular output', () => {
      test('should refuse directory output even with --force', (t) => {
        const cwd = withDefinition(t);
        fails(invoke(cwd, 'palette.json', cwd, '--force'), /non-regular file/);
      });

      test('should refuse symlink output even with --force', (t) => {
        const cwd = withDefinition(t);
        fs.writeFileSync(path.join(cwd, 'target.css'), 'keep target');
        fs.symlinkSync(
          path.join(cwd, 'target.css'),
          path.join(cwd, 'link.css'),
        );
        fails(
          invoke(cwd, 'palette.json', 'link.css', '--force'),
          /non-regular file/,
        );
      });

      test('should leave symlink targets unchanged', (t) => {
        const cwd = withDefinition(t);
        fs.writeFileSync(path.join(cwd, 'target.css'), 'keep target');
        fs.symlinkSync(
          path.join(cwd, 'target.css'),
          path.join(cwd, 'link.css'),
        );
        fails(
          invoke(cwd, 'palette.json', 'link.css', '--force'),
          /non-regular file/,
        );
        assert.equal(
          fs.readFileSync(path.join(cwd, 'target.css'), 'utf8'),
          'keep target',
        );
      });
    });
  });
}
