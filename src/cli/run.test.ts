import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../..');
const cli = path.join(root, 'bin/argot.js');

describe('CLI', () => {
  test('should print usage for --help', () => {
    const help = execFileSync(process.execPath, [cli, '--help'], {
      encoding: 'utf8',
    });
    assert.match(help, /Usage:/);
  });
});
