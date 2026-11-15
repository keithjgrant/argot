import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadPaletteDefinition } from './node.ts';
import { generatePaletteCss } from './render.ts';

describe('loadPaletteDefinition', () => {
  test('sample JSON loads numeric seeds directly', () => {
    const input = loadPaletteDefinition(
      fileURLToPath(
        new URL('../../scripts/fixtures/palette.json', import.meta.url),
      ),
    );
    assert.deepEqual(input.colors, [
      { name: 'gray', l: 0.6, c: 0.015, h: 250 },
      { name: 'brand', l: 0.6, c: 0.2, h: 250 },
    ]);
  });
});

describe('integration', () => {
  test('sample JSON generates primitive CSS', () => {
    const input = loadPaletteDefinition(
      fileURLToPath(
        new URL('../../scripts/fixtures/palette.json', import.meta.url),
      ),
    );
    assert.match(generatePaletteCss(input), /--gray-16:/);
    assert.match(generatePaletteCss(input), /--brand-16:/);
  });
});
