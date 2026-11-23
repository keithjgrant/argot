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
    ],

    // reject: [
    //   {
    //     code: 'a {}',
    //     message: 'Unexpected empty block (block-no-empty)',
    //   },
    // ],
  });
});
