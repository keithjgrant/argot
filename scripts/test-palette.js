import assert from 'node:assert/strict';
import { test } from 'node:test';
import Color from 'colorjs.io';
import { fileURLToPath } from 'node:url';
import { loadPaletteDefinition } from '@keithjgrant/argot/palette/node';
import {
  generatePalette,
  generatePaletteCss,
  normalizePaletteDefinition,
  parseCssColor,
  renderPaletteCss,
  serializePaletteDefinition,
} from '@keithjgrant/argot/palette';
import { referencePalette } from './fixtures/theme-machine-curves.js';

function definition(seed, options) {
  return {
    version: 1,
    colors: [{ name: 'brand', ...seed }],
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
  { l: 0.623456789123, c: 1e-14, h: -12.3456789123 },
  { l: 0.623456789123, c: 0.123456789123, h: 721.23456789123 },
];

test('sample JSON loads numeric seeds directly and generates primitive CSS', () => {
  const input = loadPaletteDefinition(
    fileURLToPath(new URL('./fixtures/palette.json', import.meta.url)),
  );
  assert.deepEqual(input.colors, [
    { name: 'gray', l: 0.6, c: 0.015, h: 250 },
    { name: 'brand', l: 0.6, c: 0.2, h: 250 },
  ]);
  assert.match(generatePaletteCss(input), /--gray-16:/);
  assert.match(generatePaletteCss(input), /--brand-16:/);
});

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

test('centered mode preserves fixed endpoints even outside the usual lightness range', () => {
  for (const l of [0.01, 0.99]) {
    const palette = generatePalette(
      definition({ l, c: 0.1, h: 250 }, { lightnessCurve: 'centered' }),
    ).colors[0];
    assert.equal(palette.steps[0].l, 0.98);
    assert.ok(Math.abs(palette.steps[15].l - 0.1) < 1e-12);
    assert.equal(palette.steps[8].l, l);
  }
});

test('numeric definitions preserve precision, tiny chroma and unwrapped hue without mutation', () => {
  const seed = Object.freeze({
    l: 0.6234567891234567,
    c: 1e-14,
    h: -721.2345678912345,
  });
  const color = Object.freeze({ name: 'brand', ...seed });
  const input = Object.freeze({
    version: 1,
    colors: Object.freeze([color]),
    options: Object.freeze({
      lightnessCurve: 'inclusive',
      chromaCurve: 'weighted',
    }),
  });
  const normalized = normalizePaletteDefinition(input);
  assert.deepEqual(normalized.colors, [color]);
  assert.notEqual(normalized.colors, input.colors);
  assert.notEqual(normalized.colors[0], color);
  const palette = generatePalette(input);
  const base = palette.colors[0].steps[palette.colors[0].baseStep - 1];
  assert.deepEqual({ l: base.l, c: base.c, h: base.h }, seed);
  assert.ok(palette.colors[0].steps.every(({ h }) => h === seed.h));
  const serialized = serializePaletteDefinition(input);
  const reloaded = normalizePaletteDefinition(JSON.parse(serialized));
  assert.deepEqual(reloaded, normalized);
  assert.equal(serializePaletteDefinition(reloaded), serialized);
  assert.deepEqual(generatePalette(reloaded), palette);
});

test('numeric seed validation reports invalid or missing coordinates by field', () => {
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
        () => normalizePaletteDefinition(definition(seed)),
        new RegExp(`definition\\.colors\\[0\\]\\.${field}:`),
      );
    }
    const seed = { l: 0.6, c: 0.2, h: 250 };
    delete seed[field];
    assert.throws(
      () => generatePalette(definition(seed)),
      new RegExp(`definition\\.colors\\[0\\]\\.${field}:`),
    );
  }
  for (const l of [0, 1]) {
    assert.equal(
      normalizePaletteDefinition(definition({ l, c: 0, h: 250 })).colors[0].l,
      l,
    );
  }
  const neutral = normalizePaletteDefinition(
    definition({ l: 0.6, c: 0, h: 250 }),
  );
  assert.equal(neutral.colors[0].h, 250);
});

test('legacy strings and ambiguous or unknown seed fields are rejected', () => {
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

test('numeric definitions retain name, version and option validation', () => {
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
          colors: names.map((name) => ({ name, ...seed })),
        }),
      /duplicate custom property/,
    );
  }
  assert.throws(
    () =>
      normalizePaletteDefinition({
        version: 2,
        colors: [{ name: 'brand', ...seed }],
      }),
    /version/,
  );
  assert.throws(
    () =>
      normalizePaletteDefinition({
        version: 1,
        colors: [{ name: '--brand', ...seed }],
      }),
    /colors\[0\].name/,
  );
  assert.throws(
    () => generatePalette(definition(seed, { lightnessCurve: 'custom' })),
    /lightnessCurve/,
  );
  assert.throws(
    () => generatePalette(definition(seed, { format: 'hex', gamut: 'p3' })),
    /hex output requires srgb/,
  );
});

test('CSS color parsing is an explicit adapter that returns numeric generation inputs', () => {
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
  assert.deepEqual(parseCssColor('black'), { l: 0, c: 0, h: 0 });
  assert.deepEqual(parseCssColor('white'), { l: 1, c: 0, h: 0 });
  assert.deepEqual(parseCssColor('oklch(60% 0 none)'), { l: 0.6, c: 0, h: 0 });
  const tiny = parseCssColor('oklch(60% 0.00000000000001 250)');
  assert.equal(tiny.c, 1e-14);
});

test('CSS parser rejects invalid, transparent, missing-component and context-dependent colors', () => {
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
    assert.throws(() => parseCssColor(color), /color[.:]/);
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
        assert.throws(
          () => generatePalette(input),
          /undefined chroma multiplier/,
        );
      } else {
        const actual = generatePalette(input).colors[0].steps;
        assert.ok(actual.every(({ c }) => c === 0));
      }
    }
  }
});
