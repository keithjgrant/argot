import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { testRule } from 'stylelint-test-rule-node';
import plugin, {
  ruleName,
  isColorPrimitive,
  isColor,
} from './colorContrast.ts';

describe('colorContrast lint rule', () => {
  testRule({
    plugins: [plugin],
    ruleName: ruleName,
    config: true,

    accept: [
      {
        code: 'a { color: red }',
      },
    ],

    // reject: [
    //   {
    //     code: 'a {}',
    //     message: 'Unexpected empty block (block-no-empty)',
    //   },
    // ],
  });
  // });

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
});
