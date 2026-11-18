import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImportParams } from './parseImportParams.ts';

describe('parseImportParams', () => {
  test('should parse a quoted path', () => {
    assert.deepEqual(parseImportParams("'./base.css'"), {
      uri: './base.css',
    });
  });

  test('should parse url() and layer()', () => {
    assert.deepEqual(parseImportParams('url("./base.css") layer(base)'), {
      uri: './base.css',
      layer: 'base',
    });
  });

  test('should return null for media conditions', () => {
    assert.equal(parseImportParams("'./base.css' (min-width: 600px)"), null);
  });
});
