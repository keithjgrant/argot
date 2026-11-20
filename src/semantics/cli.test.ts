import { describe, test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { generateCss } from './generate.ts';

const root = path.resolve(import.meta.dirname, '../..');
const cli = path.join(root, 'bin/argot.js');

function workspace(t: TestContext): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-cli-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

describe('Semantics CLI', () => {
  test('should generate a core template matching generateCss outside the package', (t) => {
    const cwd = workspace(t);
    execFileSync(process.execPath, [cli, 'semantics', 'core.css'], { cwd });
    assert.equal(
      fs.readFileSync(path.join(cwd, 'core.css'), 'utf8'),
      generateCss({ extended: false }),
    );
  });

  test('should generate an extended template matching generateCss outside the package', (t) => {
    const cwd = workspace(t);
    execFileSync(
      process.execPath,
      [cli, 'semantics', 'extended.css', '--extended'],
      { cwd },
    );
    assert.equal(
      fs.readFileSync(path.join(cwd, 'extended.css'), 'utf8'),
      generateCss({ extended: true }),
    );
  });

  test('should exit with status 1 for an unknown command', () => {
    const unknown = spawnSync(process.execPath, [cli, 'unknown'], {
      encoding: 'utf8',
    });
    assert.equal(unknown.status, 1);
    assert.match(unknown.stderr, /Unknown command/);
  });
});
