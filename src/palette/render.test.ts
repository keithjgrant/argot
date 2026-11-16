import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import Color from 'colorjs.io';
import postcss from 'postcss';
import { generatePalette } from './generate.ts';
import { generatePaletteCss, renderPaletteCss } from './render.ts';
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

const formatGamuts = [
  ['oklch', 'p3'],
  ['oklch', 'srgb'],
  ['hex', 'srgb'],
] as const;

describe('renderPaletteCss', () => {
  test('should map step colors into the requested gamut', () => {
    const seed = { l: 0.65, c: 0.4, h: 30 };
    for (const [format, gamut] of formatGamuts) {
      const css = renderPaletteCss(
        generatePalette(definition(seed, { format, gamut })),
      );
      postcss.parse(css).walkDecls(({ value }) => {
        if (value.startsWith('var(')) return;
        assert.ok(new Color(value).inGamut(gamut, { epsilon: 0.0001 }), value);
      });
    }
  });

  test('should format values as hex or oklch according to format', () => {
    const seed = { l: 0.65, c: 0.4, h: 30 };
    for (const [format, gamut] of formatGamuts) {
      const css = renderPaletteCss(
        generatePalette(definition(seed, { format, gamut })),
      );
      let steps = 0;
      postcss.parse(css).walkDecls(({ value }) => {
        if (value.startsWith('var(')) return;
        steps++;
        if (format === 'hex') assert.match(value, /^#[0-9a-f]{6}$/i);
        else assert.match(value, /^oklch\(/);
      });
      assert.equal(steps, 16);
    }
  });

  test('should emit different oklch CSS for p3 and srgb', () => {
    const seed = { l: 0.65, c: 0.4, h: 30 };
    const p3 = renderPaletteCss(
      generatePalette(definition(seed, { format: 'oklch', gamut: 'p3' })),
    );
    const srgb = renderPaletteCss(
      generatePalette(definition(seed, { format: 'oklch', gamut: 'srgb' })),
    );
    assert.notEqual(p3, srgb);
  });

  test('should not mutate palette steps when rendering', () => {
    const seed = { l: 0.65, c: 0.4, h: 30 };
    const palette = generatePalette(definition(seed));
    const before = structuredClone(palette);
    renderPaletteCss(palette);
    assert.deepEqual(palette, before);
  });

  test('should round CSS output to six digits of precision', () => {
    const seed = { l: 0.623456789123, c: 0.123456789123, h: 250 };
    const palette = generatePalette(
      definition(seed, {
        lightnessCurve: 'inclusive',
        chromaCurve: 'weighted',
      }),
    );
    const base = palette.colors[0].steps[palette.colors[0].baseStep - 1];
    const css = renderPaletteCss(palette);
    const expected = new Color('oklch', [base.l, base.c, base.h])
      .toGamut({ space: 'p3', method: 'css' })
      .to('oklch')
      .toString({ precision: 6 });
    assert.ok(css.includes(expected));
  });

  test('should leave the palette model unchanged after rounding for CSS', () => {
    const seed = { l: 0.623456789123, c: 0.123456789123, h: 250 };
    const palette = generatePalette(
      definition(seed, {
        lightnessCurve: 'inclusive',
        chromaCurve: 'weighted',
      }),
    );
    const before = structuredClone(palette);
    const base = palette.colors[0].steps[palette.colors[0].baseStep - 1];
    assert.equal(base.l, seed.l);
    assert.equal(base.c, seed.c);
    renderPaletteCss(palette);
    assert.deepEqual(palette, before);
  });
});

describe('integration', () => {
  test('should match generatePaletteCss to renderPaletteCss(generatePalette(...))', () => {
    const seed = { l: 0.65, c: 0.4, h: 30 };
    for (const [format, gamut] of formatGamuts) {
      const input = definition(seed, { format, gamut });
      assert.equal(
        renderPaletteCss(generatePalette(input)),
        generatePaletteCss(input),
      );
    }
  });

  test('should match precision path to generatePaletteCss after renderPaletteCss', () => {
    const seed = { l: 0.623456789123, c: 0.123456789123, h: 250 };
    const input = definition(seed, {
      lightnessCurve: 'inclusive',
      chromaCurve: 'weighted',
    });
    const palette = generatePalette(input);
    assert.equal(renderPaletteCss(palette), generatePaletteCss(input));
  });
});
