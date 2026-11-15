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
    colors: [{ name: 'brand', ...seed }],
    options,
  };
}

describe('renderPaletteCss', () => {
  test('maps supported format/gamut combinations into gamut without mutating palette steps', () => {
    const seed = { l: 0.65, c: 0.4, h: 30 };
    const palette = generatePalette(definition(seed));
    const before = structuredClone(palette);
    const rendered = new Map<string, string>();
    for (const [format, gamut] of [
      ['oklch', 'p3'],
      ['oklch', 'srgb'],
      ['hex', 'srgb'],
    ] as const) {
      const css = renderPaletteCss(
        generatePalette(definition(seed, { format, gamut })),
      );
      rendered.set(`${format}/${gamut}`, css);
      let steps = 0;
      postcss.parse(css).walkDecls(({ value }) => {
        if (value.startsWith('var(')) return;
        steps++;
        assert.ok(new Color(value).inGamut(gamut, { epsilon: 0.0001 }), value);
        if (format === 'hex') assert.match(value, /^#[0-9a-f]{6}$/i);
        else assert.match(value, /^oklch\(/);
      });
      assert.equal(steps, 16);
    }
    assert.notEqual(rendered.get('oklch/p3'), rendered.get('oklch/srgb'));
    assert.deepEqual(palette, before);
  });

  test('rounds only for CSS output and leaves the palette model unchanged', () => {
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
    const css = renderPaletteCss(palette);
    const expected = new Color('oklch', [base.l, base.c, base.h])
      .toGamut({ space: 'p3', method: 'css' })
      .to('oklch')
      .toString({ precision: 6 });
    assert.ok(css.includes(expected));
    assert.deepEqual(palette, before);
  });
});

describe('integration', () => {
  test('generatePaletteCss matches renderPaletteCss(generatePalette(...))', () => {
    const seed = { l: 0.65, c: 0.4, h: 30 };
    for (const [format, gamut] of [
      ['oklch', 'p3'],
      ['oklch', 'srgb'],
      ['hex', 'srgb'],
    ] as const) {
      const input = definition(seed, { format, gamut });
      assert.equal(
        renderPaletteCss(generatePalette(input)),
        generatePaletteCss(input),
      );
    }
  });

  test('precision path matches generatePaletteCss after renderPaletteCss', () => {
    const seed = { l: 0.623456789123, c: 0.123456789123, h: 250 };
    const input = definition(seed, {
      lightnessCurve: 'inclusive',
      chromaCurve: 'weighted',
    });
    const palette = generatePalette(input);
    assert.equal(renderPaletteCss(palette), generatePaletteCss(input));
  });
});
