import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImportParams } from './parseImportParams.ts';

describe('parseImportParams', () => {
  test('should parse a quoted path', () => {
    assert.deepEqual(parseImportParams("'./base.css'"), {
      uri: './base.css',
    });
  });

  test('should parse unquoted url', () => {
    assert.deepEqual(parseImportParams('url(./base.css)'), {
      uri: './base.css',
    });
  });

  test('should parse url() and layer()', () => {
    assert.deepEqual(parseImportParams('url("./base.css") layer(base)'), {
      uri: './base.css',
      layer: 'base',
    });
  });

  test('should parse anonymous layer', () => {
    assert.deepEqual(parseImportParams('"./base.css" layer'), {
      uri: './base.css',
      layer: '',
    });
  });

  test('should parse supports()', () => {
    assert.deepEqual(parseImportParams('"./base.css" supports(foo: bar)'), {
      uri: './base.css',
      supports: 'foo: bar',
    });
  });

  test('should parse supports with nested parens()', () => {
    assert.deepEqual(
      parseImportParams('"./base.css" supports(color: oklch(1 1 1))'),
      {
        uri: './base.css',
        supports: 'color: oklch(1 1 1)',
      },
    );
  });

  test('should parse layer and supports()', () => {
    assert.deepEqual(
      parseImportParams('"./base.css" layer(base) supports(foo: bar)'),
      {
        uri: './base.css',
        layer: 'base',
        supports: 'foo: bar',
      },
    );
  });

  test.skip('should parse media queries', () => {
    assert.deepEqual(parseImportParams('"./base.css" (width > 500px)'), {
      uri: './base.css',
      media: '(width > 500px)',
    });
  });

  test('should return null for unknown conditions', () => {
    assert.equal(parseImportParams("'./base.css' (min-width: 600px)"), null);
  });
});
