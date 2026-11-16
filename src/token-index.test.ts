import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { getTokenIndex } from './token-index.ts';

describe('getTokenIndex', () => {
  test('includes core token names from packaged JSON', () => {
    const { names } = getTokenIndex({ extended: true });
    assert.ok(
      names.has('text-primary'),
      'expected text-primary in token index',
    );
  });
});
