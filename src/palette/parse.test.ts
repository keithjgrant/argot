import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import Color from 'colorjs.io';
import { parseCssColor } from './parse.ts';
import { normalizePaletteDefinition } from './definition.ts';
import { generatePaletteCss } from './render.ts';
import { serializePaletteDefinition } from './definition.ts';
import type { OklchColor, PaletteDefinition, PaletteOptions } from './types.ts';

function definition(
  seed: OklchColor,
  options?: PaletteOptions,
): PaletteDefinition {
  return {
    version: 1,
    colors: [{ name: 'brand', ...seed }],
    options,
  };
}

describe('parseCssColor', () => {
  test('returns numeric generation inputs for CSS colors', () => {
    assert.deepEqual(parseCssColor('oklch(60% 0.2 250)'), {
      l: 0.6,
      c: 0.2,
      h: 250,
    });
    for (const value of ['#663399', 'red', 'rgb(50% 0% 50%)']) {
      const parsed = parseCssColor(value);
      const expected = new Color(value).to('oklch').coords;
      assert.deepEqual(parsed, {
        l: expected[0],
        c: expected[1],
        h: expected[2],
      });
    }
    assert.deepEqual(parseCssColor('black'), { l: 0, c: 0, h: 0 });
    assert.deepEqual(parseCssColor('white'), { l: 1, c: 0, h: 0 });
    assert.deepEqual(parseCssColor('oklch(60% 0 none)'), {
      l: 0.6,
      c: 0,
      h: 0,
    });
    const tiny = parseCssColor('oklch(60% 0.00000000000001 250)');
    assert.equal(tiny.c, 1e-14);
  });

  test('rejects invalid, transparent, missing-component and context-dependent colors', () => {
    for (const color of [
      null,
      42,
      '',
      'not-a-color',
      'transparent',
      'rgb(0 0 0 / 50%)',
      'currentColor',
      'var(--brand)',
      'oklch(120% 0.2 250)',
      'oklch(60% -0.1 250)',
      'oklch(none 0.2 250)',
      'oklch(60% 0.2 none)',
    ]) {
      assert.throws(() => parseCssColor(color as string), /color[.:]/);
    }
  });
});

describe('integration', () => {
  test('parsed CSS colors are accepted as numeric generation inputs', () => {
    for (const value of ['#663399', 'red', 'rgb(50% 0% 50%)']) {
      const parsed = parseCssColor(value);
      const input = definition(parsed);
      assert.deepEqual(normalizePaletteDefinition(input).colors[0], {
        name: 'brand',
        ...parsed,
      });
      assert.match(generatePaletteCss(input), /--brand-16:/);
      assert.deepEqual(JSON.parse(serializePaletteDefinition(input)).colors[0], {
        name: 'brand',
        ...parsed,
      });
    }
  });
});
