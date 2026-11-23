import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isColorPrimitive, isColor, getToken } from './util.ts';
import type { TokenSection } from '../../semantics/load-tokens.ts';

describe('stylelint utils', () => {
  describe('isColorPrimitive', () => {
    test('should match basic primitive', () => {
      assert.equal(isColorPrimitive('--blue-1', '#369'), true);
    });

    test('should match multi-word primitive', () => {
      assert.equal(isColorPrimitive('--deep-blue-16', '#369'), true);
    });

    test('should match primitive with numerals', () => {
      assert.equal(isColorPrimitive('--pale-green2-100', '#369'), true);
    });

    test('should exclude when does not end in numerals', () => {
      assert.equal(isColorPrimitive('--pale-green', '#369'), false);
    });

    test('should exclude non-colors', () => {
      assert.equal(isColorPrimitive('--blue-6', 'var(--blue-5)'), false);
    });
  });

  describe('isColor', () => {
    test('should match hex colors', () => {
      assert.equal(isColor('#336699'), true);
      assert.equal(isColor('#369'), true);
      assert.equal(isColor('#282828ff'), true);
    });

    test('should exclude invalid hex colors', () => {
      assert.equal(isColor('#3366g4'), false);
      assert.equal(isColor('#282828ff00'), false);
    });

    test('should match rgb/rgba', () => {
      assert.equal(isColor('rgb(100 100 100)'), true);
      assert.equal(isColor('rgba(100, 100, 100, 0.3)'), true);
    });

    test('should match oklch', () => {
      assert.equal(isColor('oklch(100 100 100)'), true);
      assert.equal(isColor('oklch(100 100 100 / 0.3)'), true);
    });

    test('should match hsl/hsla', () => {
      assert.equal(isColor('hsl(100 100 100)'), true);
      assert.equal(isColor('hsla(100, 100, 100, 0.3)'), true);
    });

    test('should reject non-colors', () => {
      assert.equal(isColor('1px'), false);
      assert.equal(isColor('linear-gradient(0deg, white, black)'), false);
      assert.equal(isColor('sans-serif'), false);
      assert.equal(isColor('300'), false);
      assert.equal(isColor('1.2em'), false);
      assert.equal(isColor('var(--blue-1)'), false);
    });
  });

  describe('getTokenPairs', () => {
    const tokens: TokenSection[] = [
      {
        file: 'color-text.json',
        label: 'color — text',
        tokens: [
          {
            name: '--text-primary',
            value: '',
            tier: 'core',
            type: 'color',
            usage: '',
            description: '',
            pairsWith: ['bg-main', 'bg-raised', 'bg-inset'],
          },
          {
            name: '--brand-secondary',
            value: '',
            tier: 'core',
            type: 'color',
            usage: '',
            description: '',
          },
        ],
      },
      {
        file: 'color-bg.json',
        label: 'color - background',
        tokens: [
          {
            name: '--bg-main',
            value: '',
            tier: 'core',
            type: 'color',
            usage: '',
            description: '',
          },
        ],
      },
    ];

    test('should return token', () => {
      assert.deepEqual(getToken('--text-primary', tokens), tokens[0].tokens[0]);
    });

    test('should return token from second group', () => {
      assert.deepEqual(getToken('--bg-main', tokens), tokens[1].tokens[0]);
    });

    test('should return null for no match', () => {
      assert.equal(getToken('--text-custom', tokens), null);
    });
  });
});
