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
    seedColors: [{ name: 'brand', ...seed }],
    options,
  };
}

describe('parseCssColor', () => {
  test('should parse oklch percentages into numeric coordinates', () => {
    assert.deepEqual(parseCssColor('oklch(60% 0.2 250)'), {
      l: 0.6,
      c: 0.2,
      h: 250,
    });
  });

  test('should convert hex, named, and rgb colors to oklch coordinates', () => {
    for (const value of ['#663399', 'red', 'rgb(50% 0% 50%)']) {
      const parsed = parseCssColor(value);
      const expected = new Color(value).to('oklch').coords;
      assert.deepEqual(parsed, {
        l: expected[0],
        c: expected[1],
        h: expected[2],
      });
    }
  });

  test('should map black and white to zero chroma', () => {
    assert.deepEqual(parseCssColor('black'), { l: 0, c: 0, h: 0 });
    assert.deepEqual(parseCssColor('white'), { l: 1, c: 0, h: 0 });
  });

  test('should treat missing chroma hue as zero', () => {
    assert.deepEqual(parseCssColor('oklch(60% 0 none)'), {
      l: 0.6,
      c: 0,
      h: 0,
    });
  });

  test('should preserve tiny chroma precision', () => {
    const tiny = parseCssColor('oklch(60% 0.00000000000001 250)');
    assert.equal(tiny.c, 1e-14);
  });

  test('should reject non-string inputs', () => {
    for (const color of [null, 42]) {
      assert.throws(
        () => parseCssColor(color as unknown as string),
        /color[.:]/,
      );
    }
  });

  test('should reject invalid color strings', () => {
    for (const color of ['', 'not-a-color']) {
      assert.throws(() => parseCssColor(color), /color[.:]/);
    }
  });

  test('should reject transparent and alpha colors', () => {
    for (const color of ['transparent', 'rgb(0 0 0 / 50%)']) {
      assert.throws(() => parseCssColor(color), /color[.:]/);
    }
  });

  test('should reject context-dependent colors', () => {
    for (const color of ['currentColor', 'var(--brand)']) {
      assert.throws(() => parseCssColor(color), /color[.:]/);
    }
  });

  test('should reject out-of-range or missing oklch components', () => {
    for (const color of [
      'oklch(120% 0.2 250)',
      'oklch(60% -0.1 250)',
      'oklch(none 0.2 250)',
      'oklch(60% 0.2 none)',
    ]) {
      assert.throws(() => parseCssColor(color), /color[.:]/);
    }
  });
});

describe('integration', () => {
  test('should normalize parsed CSS colors as numeric seeds', () => {
    for (const value of ['#663399', 'red', 'rgb(50% 0% 50%)']) {
      const parsed = parseCssColor(value);
      assert.deepEqual(
        normalizePaletteDefinition(definition(parsed)).seedColors[0],
        {
          name: 'brand',
          ...parsed,
        },
      );
    }
  });

  test('should generate CSS from parsed CSS colors', () => {
    for (const value of ['#663399', 'red', 'rgb(50% 0% 50%)']) {
      assert.match(
        generatePaletteCss(definition(parseCssColor(value))),
        /--brand-16:/,
      );
    }
  });

  test('should serialize parsed CSS colors as numeric seeds', () => {
    for (const value of ['#663399', 'red', 'rgb(50% 0% 50%)']) {
      const parsed = parseCssColor(value);
      assert.deepEqual(
        JSON.parse(serializePaletteDefinition(definition(parsed)))
          .seedColors[0],
        {
          name: 'brand',
          ...parsed,
        },
      );
    }
  });
});
