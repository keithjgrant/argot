import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { generateName, dedupeNames } from './generateName.ts';
import type { NormalizedSeedColor } from './types.ts';

function seed(
  name: string,
  color: { l?: number; c?: number; h?: number } = {},
): NormalizedSeedColor {
  return {
    name,
    l: color.l ?? 0.6,
    c: color.c ?? 0.2,
    h: color.h ?? 250,
  };
}

describe('generateName', () => {
  test('should map chromatic hues to the nearest named color', () => {
    assert.equal(generateName({ l: 0.6, c: 0.2, h: 255 }), 'blue');
    assert.equal(generateName({ l: 0.6, c: 0.2, h: 30 }), 'red');
    assert.equal(generateName({ l: 0.6, c: 0.2, h: 150 }), 'green');
  });

  test('should round chromatic hues to the nearest 15° bucket', () => {
    assert.equal(generateName({ l: 0.6, c: 0.2, h: 247 }), 'azure');
    assert.equal(generateName({ l: 0.6, c: 0.2, h: 248 }), 'blue');
  });

  test('should map low-chroma colors to neutral names', () => {
    assert.equal(generateName({ l: 0.6, c: 0.049, h: 240 }), 'slate');
    assert.equal(generateName({ l: 0.6, c: 0, h: 60 }), 'sand');
  });

  test('should treat chroma at the threshold as chromatic', () => {
    assert.equal(generateName({ l: 0.6, c: 0.05, h: 240 }), 'azure');
  });

  test('should wrap hue 360 to raspberry for chromatic colors', () => {
    assert.equal(generateName({ l: 0.6, c: 0.2, h: 360 }), 'raspberry');
  });
});

describe('dedupeNames', () => {
  test('should leave unique names unchanged', () => {
    const colors = [seed('blue'), seed('red'), seed('green')];
    assert.deepEqual(
      dedupeNames(colors).map((color) => color.name),
      ['blue', 'red', 'green'],
    );
  });

  test('should suffix duplicate names with their occurrence count', () => {
    const colors = [seed('blue'), seed('blue'), seed('blue')];
    assert.deepEqual(
      dedupeNames(colors).map((color) => color.name),
      ['blue', 'blue2', 'blue3'],
    );
  });

  test('should skip colors with empty names', () => {
    const colors = [seed(''), seed('blue'), seed('')];
    assert.deepEqual(
      dedupeNames(colors).map((color) => color.name),
      ['', 'blue', ''],
    );
  });

  test('should mutate the input array entries in place', () => {
    const colors = [seed('blue'), seed('blue')];
    const result = dedupeNames(colors);
    assert.equal(result, colors);
    assert.equal(colors[1].name, 'blue2');
  });
});
