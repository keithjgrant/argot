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

  test('should parse layer with dotted sublayer', () => {
    assert.deepEqual(parseImportParams('"./base.css" layer(base.reset)'), {
      uri: './base.css',
      layer: 'base.reset',
    });
  });

  test('should parse media queries', () => {
    assert.deepEqual(parseImportParams('"./base.css" (width > 500px)'), {
      uri: './base.css',
      media: '(width > 500px)',
    });
  });

  test('should parse multiple media queries', () => {
    assert.deepEqual(
      parseImportParams('"./base.css" screen, (pointer: fine)'),
      {
        uri: './base.css',
        media: 'screen, (pointer: fine)',
      },
    );
  });

  test('should parse layer and media queries', () => {
    assert.deepEqual(
      parseImportParams('"./base.css" layer(base) screen and (width > 500px)'),
      {
        uri: './base.css',
        layer: 'base',
        media: 'screen and (width > 500px)',
      },
    );
  });

  test('should parse bare scope', () => {
    assert.deepEqual(parseImportParams('"./base.css" scope'), {
      uri: './base.css',
      scope: '',
    });
  });

  test('should parse scope()', () => {
    assert.deepEqual(parseImportParams('"./base.css" scope(.card)'), {
      uri: './base.css',
      scope: '(.card)',
    });
  });

  test('should parse scope() with inner bound', () => {
    assert.deepEqual(
      parseImportParams('"./base.css" scope((.card) to (.content > *))'),
      {
        uri: './base.css',
        scope: '(.card) to (.content > *)',
      },
    );
  });

  test('should parse layer and scope()', () => {
    assert.deepEqual(
      parseImportParams('"./base.css" layer(base) scope(.card)'),
      {
        uri: './base.css',
        layer: 'base',
        scope: '(.card)',
      },
    );
  });

  test('should parse supports then layer', () => {
    assert.deepEqual(
      parseImportParams('"./base.css" supports(foo: bar) layer(base)'),
      {
        uri: './base.css',
        layer: 'base',
        supports: 'foo: bar',
      },
    );
  });

  test('should parse scope with inner bound with supports and layer', () => {
    assert.deepEqual(
      parseImportParams(
        '"./base.css" supports(foo: bar) scope(.top to .bottom) layer(base)',
      ),
      {
        uri: './base.css',
        layer: 'base',
        supports: 'foo: bar',
        scope: '(.top to .bottom)',
      },
    );
  });

  test('should parse scope then supports then layer with media last', () => {
    assert.deepEqual(
      parseImportParams(
        '"./base.css" scope(.card) supports(foo: bar) layer(base) screen',
      ),
      {
        uri: './base.css',
        layer: 'base',
        scope: '(.card)',
        supports: 'foo: bar',
        media: 'screen',
      },
    );
  });

  test('should reject unknown function-like rule', () => {
    assert.equal(parseImportParams('"./base.css" layer(base) foo(bar)'), null);
  });

  test('should reject duplicate layer', () => {
    assert.equal(
      parseImportParams('"./base.css" layer(base) layer(other)'),
      null,
    );
  });

  test('should reject duplicate supports', () => {
    assert.equal(
      parseImportParams(
        '"./base.css" supports(foo: bar) supports(display: grid-lanes)',
      ),
      null,
    );
  });

  test('should reject supports after media', () => {
    assert.equal(
      parseImportParams('"./base.css" screen supports(foo: bar)'),
      null,
    );
  });
});
