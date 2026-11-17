import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePalette } from './generatePalette.ts';
import type {
  OklchColor,
  PaletteOptions,
  PaletteDefinition,
  LightnessCurve,
  ChromaCurve,
} from './types.ts';

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

describe('generatePalette', () => {
  describe('centered/weighted', () => {
    test('should retain the weighted peak at the original nearest step', () => {
      const palette = generatePalette(
        definition(
          { l: 0.84, c: 0.2, h: 250 },
          { lightnessCurve: 'centered', chromaCurve: 'weighted' },
        ),
      ).colors[0];
      assert.equal(palette.baseStep, 9);
      assert.equal(palette.steps[8].l, 0.84);
      assert.equal(palette.steps[8].c, 0.2);
      assert.ok(palette.steps[3].c > palette.steps[8].c);
    });
  });

  describe('centered lightness curve', () => {
    test('should preserve fixed endpoints even outside the usual lightness range', () => {
      for (const l of [0.01, 0.99]) {
        const palette = generatePalette(
          definition({ l, c: 0.1, h: 250 }, { lightnessCurve: 'centered' }),
        ).colors[0];
        assert.equal(palette.steps[0].l, 0.98);
        assert.ok(Math.abs(palette.steps[15].l - 0.1) < 1e-12);
        assert.equal(palette.steps[8].l, l);
      }
    });
  });

  test('should resolve neutral seeds to zero chroma for every curve combination', () => {
    const seed = { l: 0.6, c: 0, h: 0 };
    for (const lightnessCurve of [
      'uniform',
      'inclusive',
      'centered',
    ] as LightnessCurve[]) {
      for (const chromaCurve of ['centered', 'weighted'] as ChromaCurve[]) {
        const actual = generatePalette(
          definition(seed, { lightnessCurve, chromaCurve }),
        ).colors[0].steps;
        assert.ok(actual.every(({ c }) => c === 0));
      }
    }
  });

  test('should leave raw steps unchanged for format and gamut options', () => {
    const seed = { l: 0.65, c: 0.4, h: 30 };
    const baseline = generatePalette(definition(seed));
    for (const [format, gamut] of [
      ['oklch', 'p3'],
      ['oklch', 'srgb'],
      ['hex', 'srgb'],
    ] as const) {
      assert.deepEqual(
        generatePalette(definition(seed, { format, gamut })).colors,
        baseline.colors,
      );
    }
  });

  test('should preserve seed precision including unwrapped hue', () => {
    const seed = Object.freeze({
      l: 0.6234567891234567,
      c: 1e-14,
      h: -721.2345678912345,
    });
    const palette = generatePalette(
      definition(seed, {
        lightnessCurve: 'inclusive',
        chromaCurve: 'weighted',
      }),
    );
    const base = palette.colors[0].steps[palette.colors[0].baseStep - 1];
    assert.deepEqual({ l: base.l, c: base.c, h: base.h }, seed);
    assert.ok(palette.colors[0].steps.every(({ h }) => h === seed.h));
  });
});
