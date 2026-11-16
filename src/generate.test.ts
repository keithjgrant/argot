import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateCss } from './generate.ts';

const root = path.resolve(import.meta.dirname, '..');

describe('generateCss', () => {
  test('checked-in CSS templates match the current token definitions', () => {
    for (const extended of [false, true]) {
      const file = extended ? 'semantics-extended.css' : 'semantics.css';
      assert.equal(
        generateCss({ extended }),
        fs.readFileSync(path.join(root, 'templates', file), 'utf8'),
      );
    }
  });
});
