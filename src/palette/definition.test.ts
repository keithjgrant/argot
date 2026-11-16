import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePaletteDefinition,
  serializePaletteDefinition,
} from './definition.ts';
import { generatePalette } from './generate.ts';
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

describe('normalizePaletteDefinition', () => {
  test('should return a fresh copy without mutating numeric seeds', () => {
    const seed = Object.freeze({
      l: 0.6234567891234567,
      c: 1e-14,
      h: -721.2345678912345,
    });
    const color = Object.freeze({ name: 'brand', ...seed });
    const input = Object.freeze({
      version: 1 as const,
      seedColors: Object.freeze([color]),
      options: Object.freeze({
        lightnessCurve: 'inclusive' as const,
        chromaCurve: 'weighted' as const,
      }),
    });
    const normalized = normalizePaletteDefinition(input);
    assert.deepEqual(normalized.seedColors, [color]);
    assert.notEqual(normalized.seedColors, input.seedColors);
    assert.notEqual(normalized.seedColors[0], color);
  });

  test('should report invalid or missing coordinates by field', () => {
    const invalid = {
      l: [
        undefined,
        null,
        '',
        '0.6',
        '60%',
        NaN,
        Infinity,
        -Infinity,
        -1e-14,
        1.00000000000001,
      ],
      c: [undefined, null, '0.2', NaN, Infinity, -Infinity, -1e-14],
      h: [undefined, null, '250deg', NaN, Infinity, -Infinity],
    };
    for (const [field, values] of Object.entries(invalid)) {
      for (const value of values) {
        const seed = { l: 0.6, c: 0.2, h: 250, [field]: value };
        assert.throws(
          () => normalizePaletteDefinition(definition(seed as OklchColor)),
          new RegExp(`definition\\.seedColors\\[0\\]\\.${field}:`),
        );
      }
      const seed: Record<string, number> = { l: 0.6, c: 0.2, h: 250 };
      delete seed[field];
      assert.throws(
        () =>
          normalizePaletteDefinition(definition(seed as unknown as OklchColor)),
        new RegExp(`definition\\.seedColors\\[0\\]\\.${field}:`),
      );
    }
    for (const l of [0, 1]) {
      assert.equal(
        normalizePaletteDefinition(definition({ l, c: 0, h: 250 }))
          .seedColors[0].l,
        l,
      );
    }
    const neutral = normalizePaletteDefinition(
      definition({ l: 0.6, c: 0, h: 250 }),
    );
    assert.equal(neutral.seedColors[0].h, 250);
  });

  test('should reject legacy strings and ambiguous or unknown seed fields', () => {
    const cases = [
      { name: 'brand', color: '#663399' },
      { name: 'brand', l: 0.6, c: 0.2, h: 250, color: '#663399' },
      { name: 'brand', l: 0.6, c: 0.2, h: 250, alpha: 0.5 },
      { name: 'brand', l: 0.6, c: 0.2, h: 250, space: 'lch' },
    ];
    for (const color of cases) {
      assert.throws(
        () => normalizePaletteDefinition({ version: 1, colors: [color] }),
        /unknown field/,
      );
    }
  });

  test('should retain name, version and option validation', () => {
    const seed = { l: 0.6, c: 0.2, h: 250 };
    for (const names of [
      ['brand', 'brand'],
      ['brand', 'brand-1'],
      ['brand-16', 'brand'],
    ]) {
      assert.throws(
        () =>
          normalizePaletteDefinition({
            version: 1,
            seedColors: names.map((name) => ({ name, ...seed })),
          }),
        /duplicate custom property/,
      );
    }
    assert.throws(
      () =>
        normalizePaletteDefinition({
          version: 2,
          seedColors: [{ name: 'brand', ...seed }],
        }),
      /version/,
    );
    assert.throws(
      () =>
        normalizePaletteDefinition({
          version: 1,
          seedColors: [{ name: '--brand', ...seed }],
        }),
      /seedColors\[0\]\.name/,
    );
    assert.throws(
      () =>
        normalizePaletteDefinition(
          definition(seed, { lightnessCurve: 'custom' as never }),
        ),
      /lightnessCurve/,
    );
    assert.throws(
      () =>
        normalizePaletteDefinition(
          definition(seed, { format: 'hex', gamut: 'p3' }),
        ),
      /hex output requires srgb/,
    );
  });
});

describe('serializePaletteDefinition', () => {
  test('should round-trip through JSON without changing normalized values', () => {
    const seed = Object.freeze({
      l: 0.6234567891234567,
      c: 1e-14,
      h: -721.2345678912345,
    });
    const input = Object.freeze({
      version: 1 as const,
      seedColors: Object.freeze([{ name: 'brand', ...seed }]),
      options: Object.freeze({
        lightnessCurve: 'inclusive' as const,
        chromaCurve: 'weighted' as const,
      }),
    });
    const normalized = normalizePaletteDefinition(input);
    const serialized = serializePaletteDefinition(input);
    const reloaded = normalizePaletteDefinition(JSON.parse(serialized));
    assert.deepEqual(reloaded, normalized);
    assert.equal(serializePaletteDefinition(reloaded), serialized);
  });
});

describe('integration', () => {
  test('should fail missing coordinates through generatePalette with the same field errors', () => {
    const invalid = {
      l: [undefined],
      c: [undefined],
      h: [undefined],
    };
    for (const [field, values] of Object.entries(invalid)) {
      for (const value of values) {
        const seed = { l: 0.6, c: 0.2, h: 250, [field]: value };
        assert.throws(
          () => generatePalette(definition(seed as OklchColor)),
          new RegExp(`definition\\.seedColors\\[0\\]\\.${field}:`),
        );
      }
      const seed: Record<string, number> = { l: 0.6, c: 0.2, h: 250 };
      delete seed[field];
      assert.throws(
        () => generatePalette(definition(seed as unknown as OklchColor)),
        new RegExp(`definition\\.seedColors\\[0\\]\\.${field}:`),
      );
    }
  });

  test('should fail invalid options through generatePalette', () => {
    const seed = { l: 0.6, c: 0.2, h: 250 };
    assert.throws(
      () =>
        generatePalette(
          definition(seed, { lightnessCurve: 'custom' as never }),
        ),
      /lightnessCurve/,
    );
    assert.throws(
      () => generatePalette(definition(seed, { format: 'hex', gamut: 'p3' })),
      /hex output requires srgb/,
    );
  });

  test('should preserve generatePalette output through serialize and normalize', () => {
    const seed = Object.freeze({
      l: 0.6234567891234567,
      c: 1e-14,
      h: -721.2345678912345,
    });
    const input = Object.freeze({
      version: 1 as const,
      seedColors: Object.freeze([{ name: 'brand', ...seed }]),
      options: Object.freeze({
        lightnessCurve: 'inclusive' as const,
        chromaCurve: 'weighted' as const,
      }),
    });
    const palette = generatePalette(input);
    const reloaded = normalizePaletteDefinition(
      JSON.parse(serializePaletteDefinition(input)),
    );
    assert.deepEqual(generatePalette(reloaded), palette);
  });
});
