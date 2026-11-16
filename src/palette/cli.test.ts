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
  colors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
};

function workspace(t: TestContext): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-palette-cli-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

describe('integration', () => {
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

    describe(`${mode} CLI`, () => {
      test('supports dry runs, default output and explicit replacement', (t) => {
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
        const forcedPreview = invoke(
          cwd,
          'palette.json',
          '--force',
          '--dry-run',
        );
        assert.equal(forcedPreview.status, 0, forcedPreview.stderr);
        assert.equal(fs.readFileSync(output, 'utf8'), 'user edit');
        const forced = invoke(cwd, 'palette.json', '--force');
        assert.equal(forced.status, 0, forced.stderr);
        assert.equal(
          fs.readFileSync(output, 'utf8'),
          generatePaletteCss(definition),
        );
      });

      test('rejects invalid arguments and identical resolved paths', (t) => {
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

      test('reports input errors without creating output', (t) => {
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

      test('refuses directory and symlink output even with force', (t) => {
        const cwd = workspace(t);
        fs.writeFileSync(
          path.join(cwd, 'palette.json'),
          JSON.stringify(definition),
        );
        fails(invoke(cwd, 'palette.json', cwd, '--force'), /non-regular file/);
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
  }
});
