import assert from 'node:assert/strict';
import { test } from 'node:test';
import Color from 'colorjs.io';
import postcss from 'postcss';
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
import golden from './fixtures/palette-golden.json' with { type: 'json' };

function definition(seed, options) {
  return {
    version: 1,
    colors: [{ name: 'brand', ...seed }],
    options,
  };
}

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

test('golden baseline covers every curve combination with complete fixed expectations', () => {
  assert.equal(golden.schemaVersion, 1);
  assert.equal(golden.cases.length, 96);
  assert.equal(new Set(golden.cases.map(({ id }) => id)).size, 96);
  const seeds = new Map();
  for (const entry of golden.cases) {
    const key = JSON.stringify(entry.seed);
    if (!seeds.has(key)) seeds.set(key, new Set());
    const combination = `${entry.options.lightnessCurve}/${entry.options.chromaCurve}`;
    assert.ok(!seeds.get(key).has(combination), entry.id);
    seeds.get(key).add(combination);
    if (entry.expectedError) {
      assert.equal(entry.expected, undefined);
      assert.equal(entry.seed.c, 0);
      assert.equal(combination, 'centered/weighted');
      continue;
    }
    const expected = entry.expected;
    assert.ok(expected.baseStep >= 1 && expected.baseStep <= 16);
    for (const coordinates of [expected.lightness, expected.chroma]) {
      assert.equal(coordinates.length, 16);
      assert.ok(coordinates.every(Number.isFinite));
    }
    assert.equal(expected.hue, entry.seed.h);
    for (const format of ['oklch', 'hex']) {
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
  assert.equal(
    golden.cases.filter(({ expectedError }) => expectedError).length,
    1,
  );
});

// These values were captured from the verified original source, not calculated
// by a second implementation during tests. Updating them requires review.
for (const { id, seed, options, expected, expectedError } of golden.cases) {
  test(`golden palette: ${id}`, () => {
    const input = definition(seed, options);
    if (expectedError) {
      assert.throws(() => generatePalette(input), new RegExp(expectedError));
      assert.throws(() => generatePaletteCss(input), new RegExp(expectedError));
      return;
    }
    const actual = generatePalette(input).colors[0];
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
    ]) {
      const css = generatePaletteCss(
        definition(seed, { ...options, format, gamut }),
      );
      const declarations = [];
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
