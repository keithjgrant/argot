import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePaletteDefinition,
  serializePaletteDefinition,
} from './validation.ts';
import { generatePalette } from './generatePalette.ts';
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

  test('should reject invalid coordinate values by field', () => {
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
    }
  });

  test('should reject missing coordinates by field', () => {
    for (const field of ['l', 'c', 'h']) {
      const seed: Record<string, number> = { l: 0.6, c: 0.2, h: 250 };
      delete seed[field];
      assert.throws(
        () =>
          normalizePaletteDefinition(definition(seed as unknown as OklchColor)),
        new RegExp(`definition\\.seedColors\\[0\\]\\.${field}:`),
      );
    }
  });

  test('should accept endpoint lightness 0 and 1', () => {
    for (const l of [0, 1]) {
      assert.equal(
        normalizePaletteDefinition(definition({ l, c: 0, h: 250 }))
          .seedColors[0].l,
        l,
      );
    }
  });

  test('should preserve hue for zero chroma', () => {
    const neutral = normalizePaletteDefinition(
      definition({ l: 0.6, c: 0, h: 250 }),
    );
    assert.equal(neutral.seedColors[0].h, 250);
  });

  test('should reject the legacy colors key', () => {
    assert.throws(
      () =>
        normalizePaletteDefinition({
          version: 1,
          colors: [{ name: 'brand', color: '#663399' }],
        }),
      /unknown field/,
    );
  });

  test('should reject unknown seed fields', () => {
    const cases = [
      { name: 'brand', l: 0.6, c: 0.2, h: 250, color: '#663399' },
      { name: 'brand', l: 0.6, c: 0.2, h: 250, alpha: 0.5 },
      { name: 'brand', l: 0.6, c: 0.2, h: 250, space: 'lch' },
    ];
    for (const color of cases) {
      assert.throws(
        () => normalizePaletteDefinition({ version: 1, seedColors: [color] }),
        /unknown field/,
      );
    }
  });

  test('should reject duplicate custom property names', () => {
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
  });

  test('should reject unsupported versions', () => {
    assert.throws(
      () =>
        normalizePaletteDefinition({
          version: 2,
          seedColors: [{ name: 'brand', l: 0.6, c: 0.2, h: 250 }],
        }),
      /version/,
    );
  });

  test('should reject invalid seed names', () => {
    assert.throws(
      () =>
        normalizePaletteDefinition({
          version: 1,
          seedColors: [{ name: '--brand', l: 0.6, c: 0.2, h: 250 }],
        }),
      /seedColors\[0\]\.name/,
    );
  });

  test('should reject unknown option values', () => {
    assert.throws(
      () =>
        normalizePaletteDefinition(
          definition(
            { l: 0.6, c: 0.2, h: 250 },
            { lightnessCurve: 'custom' as never },
          ),
        ),
      /lightnessCurve/,
    );
  });

  test('should reject hex format with non-srgb gamut', () => {
    assert.throws(
      () =>
        normalizePaletteDefinition(
          definition(
            { l: 0.6, c: 0.2, h: 250 },
            { format: 'hex', gamut: 'p3' },
          ),
        ),
      /hex output requires srgb/,
    );
  });

  test('should preserve name capitalization', () => {
    const definition: PaletteDefinition = {
      version: 1,
      seedColors: [
        { name: 'brand', l: 0.6, c: 0.1, h: 240 },
        { name: 'Azure', l: 0.6, c: 0.1, h: 240 },
        { name: 'BlUe', l: 0.6, c: 0.1, h: 240 },
      ],
    };
    const normalized = normalizePaletteDefinition(definition);

    assert.equal(normalized.seedColors[0].name, 'brand');
    assert.equal(normalized.seedColors[1].name, 'Azure');
    assert.equal(normalized.seedColors[2].name, 'BlUe');
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
    for (const field of ['l', 'c', 'h']) {
      const withUndefined = { l: 0.6, c: 0.2, h: 250, [field]: undefined };
      assert.throws(
        () => generatePalette(definition(withUndefined as OklchColor)),
        new RegExp(`definition\\.seedColors\\[0\\]\\.${field}:`),
      );
      const seed: Record<string, number> = { l: 0.6, c: 0.2, h: 250 };
      delete seed[field];
      assert.throws(
        () => generatePalette(definition(seed as unknown as OklchColor)),
        new RegExp(`definition\\.seedColors\\[0\\]\\.${field}:`),
      );
    }
  });

  test('should fail unknown option values through generatePalette', () => {
    assert.throws(
      () =>
        generatePalette(
          definition(
            { l: 0.6, c: 0.2, h: 250 },
            { lightnessCurve: 'custom' as never },
          ),
        ),
      /lightnessCurve/,
    );
  });

  test('should fail hex format with non-srgb gamut through generatePalette', () => {
    assert.throws(
      () =>
        generatePalette(
          definition(
            { l: 0.6, c: 0.2, h: 250 },
            { format: 'hex', gamut: 'p3' },
          ),
        ),
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
