import { describe } from 'node:test';
import { testRule } from 'stylelint-test-rule-node';
import plugin, { ruleName } from './colorContrast.ts';

describe('colorContrast lint rule', () => {
  testRule({
    plugins: [plugin],
    ruleName: ruleName,
    config: true,

    accept: [
      {
        code: 'a { color: red }',
      },
      {
        description: 'should ignore a token whose pair is not declared',
        code: ':root { --blue-1: #111111; --text-primary: var(--blue-1); }',
      },
    ],

    reject: [
      {
        description:
          'should report contrast on both declarations when the pair is declared later',
        code: `
          :root {
            --blue-1: #ffffff;
            --blue-2: #000000;
            --text-primary: var(--blue-1);
            --bg-main: var(--blue-2);
          }
        `,
        warnings: [
          {
            message:
              '--text-primary has contrast of 21 with --bg-main (argot/color-contrast)',
            line: 5,
            column: 13,
          },
          {
            message:
              '--bg-main has contrast of 21 with --text-primary (argot/color-contrast)',
            line: 6,
            column: 13,
          },
        ],
      },
      {
        description:
          'should report contrast on both declarations when the pair is declared first',
        code: `
          :root {
            --blue-1: #ffffff;
            --blue-2: #000000;
            --bg-main: var(--blue-2);
            --text-primary: var(--blue-1);
          }
        `,
        warnings: [
          {
            message:
              '--bg-main has contrast of 21 with --text-primary (argot/color-contrast)',
            line: 5,
            column: 13,
          },
          {
            message:
              '--text-primary has contrast of 21 with --bg-main (argot/color-contrast)',
            line: 6,
            column: 13,
          },
        ],
      },
    ],
  });
});
