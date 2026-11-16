import { describe, test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { generateCss } from './generate.ts';

const root = path.resolve(import.meta.dirname, '..');
const cli = path.join(root, 'bin/argot.js');

function workspace(t: TestContext): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'argot-cli-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

describe('integration', () => {
  test('generates identical core and extended templates outside the package', (t) => {
    const cwd = workspace(t);
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

  test('help and error handling still work', () => {
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
});
