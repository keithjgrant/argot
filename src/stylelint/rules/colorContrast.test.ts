import { describe } from 'node:test';
import { testRule } from 'stylelint-test-rule-node';
import plugin, { ruleName } from './colorContrast.ts';

describe('colorContrast lint rule', () => {
  testRule({
    plugins: [plugin],
    ruleName,
    config: true,
    accept: [
      {
        description: 'should accept non-token color declarations',
        code: 'a { color: red }',
      },
    ],
  });

  testRule({
    plugins: [plugin],
    ruleName,
    config: true,
    accept: [
      {
        description: 'should ignore a token whose pair is not declared',
        code: ':root { --blue-1: #111111; --text-primary: var(--blue-1); }',
      },
    ],
  });

  testRule({
    plugins: [plugin],
    ruleName,
    config: true,
    accept: [
      {
        description: 'should ignore tokens with strong contrast',
        code: `
          :root {
            --gray-1: #ffffff;
            --gray-16: #000000;
            --text-primary: var(--gray-1);
            --bg-main: var(--gray-16);
          }
        `,
      },
    ],
  });

  testRule({
    plugins: [plugin],
    ruleName,
    config: true,
    reject: [
      {
        description:
          'should report contrast on both declarations when the bg is declared later',
        code: `
          :root {
            --gray-1: #ffffff;
            --gray-16: #eeeeee;
            --text-primary: var(--gray-1);
            --bg-main: var(--gray-16);
          }
        `,
        warnings: [
          {
            message:
              '"--text-primary" and "--bg-main" have an insufficient contrast ratio of 1.16:1 (goal: 4.5:1) (argot/color-contrast)',
            line: 5,
            column: 13,
          },
          {
            message:
              '"--bg-main" and "--text-primary" have an insufficient contrast ratio of 1.16:1 (goal: 4.5:1) (argot/color-contrast)',
            line: 6,
            column: 13,
          },
        ],
      },
    ],
  });

  testRule({
    plugins: [plugin],
    ruleName,
    config: true,
    reject: [
      {
        description:
          'should report contrast on both declarations when the bg is declared first',
        code: `
          :root {
            --gray-1: #ffffff;
            --gray-2: #eeeeee;
            --bg-main: var(--gray-2);
            --text-primary: var(--gray-1);
          }
        `,
        warnings: [
          {
            message:
              '"--bg-main" and "--text-primary" have an insufficient contrast ratio of 1.16:1 (goal: 4.5:1) (argot/color-contrast)',
            line: 5,
            column: 13,
          },
          {
            message:
              '"--text-primary" and "--bg-main" have an insufficient contrast ratio of 1.16:1 (goal: 4.5:1) (argot/color-contrast)',
            line: 6,
            column: 13,
          },
        ],
      },
    ],
  });
});
