import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { generatePalette } from './generate.ts';
import { generatePaletteCss } from './render.ts';
import type { OklchColor, PaletteDefinition, PaletteOptions } from './types.ts';

const golden = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL('../../scripts/fixtures/palette-golden.json', import.meta.url),
    ),
    'utf8',
  ),
) as {
  schemaVersion: number;
  cases: Array<{
    id: string;
    seed: OklchColor;
    options: PaletteOptions;
    expectedError?: unknown;
    expected: {
      baseStep: number;
      lightness: number[];
      chroma: number[];
      hue: number;
      css: { oklch: string[]; hex: string[] };
    };
  }>;
};

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

describe('golden baseline', () => {
  test('covers every curve combination with complete fixed expectations', () => {
    assert.equal(golden.schemaVersion, 1);
    assert.equal(golden.cases.length, 96);
    assert.equal(new Set(golden.cases.map(({ id }) => id)).size, 96);
    const seeds = new Map<string, Set<string>>();
    for (const entry of golden.cases) {
      const key = JSON.stringify(entry.seed);
      if (!seeds.has(key)) seeds.set(key, new Set());
      const combination = `${entry.options.lightnessCurve}/${entry.options.chromaCurve}`;
      assert.ok(!seeds.get(key)!.has(combination), entry.id);
      seeds.get(key)!.add(combination);
      assert.equal(entry.expectedError, undefined);
      const expected = entry.expected;
      assert.ok(expected.baseStep >= 1 && expected.baseStep <= 16);
      for (const coordinates of [expected.lightness, expected.chroma]) {
        assert.equal(coordinates.length, 16);
        assert.ok(coordinates.every(Number.isFinite));
      }
      assert.equal(expected.hue, entry.seed.h);
      for (const format of ['oklch', 'hex'] as const) {
        assert.equal(expected.css[format].length, 16);
        assert.ok(
          expected.css[format].every((value) => typeof value === 'string'),
        );
      }
    }
    assert.equal(seeds.size, 16);
    const combinations = [
      'uniform/centered',
      'uniform/weighted',
      'inclusive/centered',
      'inclusive/weighted',
      'centered/centered',
      'centered/weighted',
    ].sort();
    for (const actual of seeds.values())
      assert.deepEqual([...actual].sort(), combinations);
  });
});

describe('integration', () => {
  // These values were captured from the verified original source in Theme Machine
  for (const { id, seed, options, expected } of golden.cases) {
    test(`golden palette: ${id}`, () => {
      const actual = generatePalette(definition(seed, options)).colors[0];
      assert.deepEqual(actual, {
        name: 'brand',
        baseStep: expected.baseStep,
        steps: expected.lightness.map((l, index) => ({
          step: index + 1,
          l,
          c: expected.chroma[index],
          h: expected.hue,
        })),
      });
      for (const [format, gamut] of [
        ['oklch', 'p3'],
        ['hex', 'srgb'],
      ] as const) {
        const css = generatePaletteCss(
          definition(seed, { ...options, format, gamut }),
        );
        const declarations: Array<[string, string]> = [];
        postcss.parse(css).walkDecls(({ prop, value }) => {
          declarations.push([prop, value]);
        });
        assert.deepEqual(
          declarations,
          [
            ...expected.css[format].map((value, index) => [
              `--brand-${index + 1}`,
              value,
            ]),
            ['--brand', `var(--brand-${expected.baseStep})`],
          ],
          `${id}: ${format}/${gamut} CSS declarations`,
        );
      }
    });
  }
});
