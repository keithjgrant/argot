import assert from 'node:assert/strict';
import { test } from 'node:test';
import Color from 'colorjs.io';
import {
  generatePalette,
  generatePaletteCss,
  renderPaletteCss,
} from '@keithjgrant/argot/palette';
import { referencePalette } from './fixtures/theme-machine-curves.js';

function definition(seed, options) {
  return {
    version: 1,
    colors: [{
      name: 'brand',
      color: `oklch(${seed.l} ${seed.c} ${seed.h})`,
    }],
    options,
  };
}

const seeds = [
  { l: 0.6, c: 0.2, h: 250 },
  { l: 0.84, c: 0.12, h: 70 },
  { l: 0.3, c: 0.03, h: 130 },
  { l: 0.71, c: 0.04, h: 0 },
  { l: 0.71, c: 0.039999, h: 180 },
  { l: 0.99, c: 0.01, h: 20 },
  { l: 0.01, c: 0.01, h: 310 },
  { l: 0, c: 0.01, h: 20 },
  { l: 1, c: 0.01, h: 20 },
  { l: (0.66 + 0.58) / 2, c: 0.123456789, h: 123.456789 },
];

for (const lightnessCurve of ['uniform', 'inclusive', 'centered']) {
  for (const chromaCurve of ['centered', 'weighted']) {
    test(`${lightnessCurve}/${chromaCurve} matches Theme Machine calculations without intermediate rounding`, () => {
      const options = { lightnessCurve, chromaCurve };
      for (const seed of seeds) {
        const [expected, index] = referencePalette(seed, options);
        const actual = generatePalette(definition(seed, options)).colors[0];
        assert.equal(actual.baseStep, index + 1);
        assert.equal(actual.steps.length, 16);
        actual.steps.forEach(({ step, l, c, h }, i) => {
          assert.equal(step, i + 1);
          for (const [key, value] of Object.entries({ l, c, h })) {
            assert.ok(
              Math.abs(value - expected[i][key]) < 1e-12,
              `${JSON.stringify(seed)} step ${step} ${key}: ${value} != ${expected[i][key]}`,
            );
          }
        });
      }
    });
  }
}

test('centered/weighted retains the weighted peak at the original nearest step', () => {
  const palette = generatePalette(definition(
    { l: 0.84, c: 0.2, h: 250 },
    { lightnessCurve: 'centered', chromaCurve: 'weighted' },
  )).colors[0];
  assert.equal(palette.baseStep, 9);
  assert.equal(palette.steps[8].l, 0.84);
  assert.equal(palette.steps[8].c, 0.2);
  assert.ok(palette.steps[3].c > palette.steps[8].c);
});

test('centered mode preserves fixed endpoints even outside the usual lightness range', () => {
  for (const l of [0.01, 0.99]) {
    const palette = generatePalette(definition(
      { l, c: 0.1, h: 250 },
      { lightnessCurve: 'centered' },
    )).colors[0];
    assert.equal(palette.steps[0].l, 0.98);
    assert.ok(Math.abs(palette.steps[15].l - 0.1) < 1e-12);
    assert.equal(palette.steps[8].l, l);
  }
});

test('precision is retained through calculation and rounded only for CSS output', () => {
  const seed = { l: 0.623456789123, c: 0.123456789123, h: 250 };
  const input = definition(seed, {
    lightnessCurve: 'inclusive',
    chromaCurve: 'weighted',
  });
  const palette = generatePalette(input);
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
  assert.equal(css, generatePaletteCss(input));
});

test('neutral calculations are preserved wherever the original multiplier is defined', () => {
  const seed = { l: 0.6, c: 0, h: 0 };
  for (const lightnessCurve of ['uniform', 'inclusive', 'centered']) {
    for (const chromaCurve of ['centered', 'weighted']) {
      const options = { lightnessCurve, chromaCurve };
      const input = definition(seed, options);
      if (lightnessCurve === 'centered' && chromaCurve === 'weighted') {
        const [reference] = referencePalette(seed, options);
        assert.ok(reference.every(({ c }) => Number.isNaN(c)));
        assert.throws(() => generatePalette(input), /undefined chroma multiplier/);
      } else {
        const actual = generatePalette(input).colors[0].steps;
        assert.ok(actual.every(({ c }) => c === 0));
      }
    }
  }
});
